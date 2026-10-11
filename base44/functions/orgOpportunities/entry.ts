import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveOrgContext, orgErrorResponse } from '../../shared/orgAuth.ts';
import { httpError, requireOrgAdmin } from '../../shared/orgEmployerSecurity.ts';
import {
  canEditOpportunity,
  canCloseOpportunity,
  requireOrgOpportunity,
  validateOpportunityInput,
} from '../../shared/orgOpportunitySecurity.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const ctx = await resolveOrgContext(base44);
    const body = await req.json().catch(() => ({}));
    const action = body?.action || "list";

    if (action === "list") {
      const jobs = await ctx.svc.entities.JobPosting.filter(
        { organization_id: ctx.organizationId },
        "-created_date",
        500
      );

      const employerIds = [...new Set(jobs.map((j) => j.org_employer_id).filter(Boolean))];
      const employers = employerIds.length
        ? await ctx.svc.entities.OrgEmployer.filter(
            { organization_id: ctx.organizationId },
            "employer_name",
            500
          )
        : [];

      const employerById = new Map(employers.map((e) => [e.id, e]));
      const staffRows = await ctx.svc.entities.OrganizationStaffAccount.filter(
        { organization_id: ctx.organizationId, active: true },
        "display_name",
        500
      );

      return Response.json({
        opportunities: jobs.map((job) => ({
          ...job,
          employer_status: employerById.get(job.org_employer_id)?.status || null,
        })),
        staff: staffRows.map((s) => ({ id: s.id, display_name: s.display_name || "Staff" })),
      });
    }

    if (action === "get") {
      const job = await requireOrgOpportunity(ctx, body?.opportunity_id);
      return Response.json({ opportunity: job });
    }

    if (action === "create") {
      const updates = await validateOpportunityInput(ctx, body);
      const created = await ctx.svc.entities.JobPosting.create({
        ...updates,
        organization_id: ctx.organizationId,
        status: "Draft",
        verification_status: "Unverified",
        submitted_by_staff_id: ctx.staffAccount.id,
        verified_by_staff_id: "",
        review_note: "",
        provider: "manual",
        source_name: "Organization Edition",
        local_job: true,
        administrator_verified: false,
      });
      return Response.json({ opportunity: created });
    }

    if (action === "update") {
      const job = await requireOrgOpportunity(ctx, body?.opportunity_id);
      if (!canEditOpportunity(ctx, job)) {
        throw httpError("You do not have permission to edit this opportunity", 403);
      }

      const updates = await validateOpportunityInput(ctx, body, job);

      const updated = await ctx.svc.entities.JobPosting.update(job.id, updates);
      return Response.json({ opportunity: updated });
    }

    if (action === "submit") {
      const job = await requireOrgOpportunity(ctx, body?.opportunity_id);
      if (ctx.orgRole !== "org_admin" && job.submitted_by_staff_id !== ctx.staffAccount.id) {
        throw httpError("You can only submit your own opportunities", 403);
      }
      if (job.status !== "Draft") {
        throw httpError("Only draft opportunities can be submitted for review", 400);
      }
      if (!["Unverified", "Returned"].includes(job.verification_status || "Unverified")) {
        throw httpError("Opportunity is not available for submission", 400);
      }
      if ((job.verification_status || "Unverified") === "Unverified" && job.submitted_at) {
        throw httpError("Opportunity is already awaiting review", 409);
      }

      // Revalidate required fields against current employer state.
      await validateOpportunityInput(ctx, {
        org_employer_id: job.org_employer_id,
        job_title: job.job_title,
        opportunity_type: job.opportunity_type,
      }, job);

      const updated = await ctx.svc.entities.JobPosting.update(job.id, {
        verification_status: "Unverified",
        submitted_at: new Date().toISOString(),
        review_note: "",
      });
      return Response.json({ opportunity: updated });
    }

    if (action === "review") {
      requireOrgAdmin(ctx);
      const job = await requireOrgOpportunity(ctx, body?.opportunity_id);
      const decision = body?.decision;
      const reviewNote = String(body?.review_note || "").trim();

      if (!["verify", "return", "reject"].includes(decision)) {
        throw httpError("Invalid review decision", 400);
      }

      if (decision === "verify") {
        if (!job.submitted_at) {
          throw httpError("Opportunity must be submitted before verification", 400);
        }

        await validateOpportunityInput(ctx, {
          org_employer_id: job.org_employer_id,
          job_title: job.job_title,
          opportunity_type: job.opportunity_type,
        }, job);

        const updated = await ctx.svc.entities.JobPosting.update(job.id, {
          verification_status: "Verified",
          status: "Active",
          verified_by_staff_id: ctx.staffAccount.id,
          verified_at: new Date().toISOString(),
          administrator_verified: true,
          review_note: reviewNote,
        });
        return Response.json({ opportunity: updated });
      }

      if (!reviewNote) {
        throw httpError("A review note is required when returning or rejecting an opportunity", 400);
      }

      const updated = await ctx.svc.entities.JobPosting.update(job.id, {
        verification_status: decision === "return" ? "Returned" : "Rejected",
        status: decision === "return" ? "Draft" : "Removed",
        verified_by_staff_id: ctx.staffAccount.id,
        review_note: reviewNote,
        administrator_verified: false,
      });
      return Response.json({ opportunity: updated });
    }

    if (action === "close") {
      const job = await requireOrgOpportunity(ctx, body?.opportunity_id);
      if (!canCloseOpportunity(ctx, job)) {
        throw httpError("You do not have permission to close this opportunity", 403);
      }

      const status = body?.status;
      if (!["Filled", "Expired", "Removed"].includes(status)) {
        throw httpError("Invalid closing status", 400);
      }

      const updated = await ctx.svc.entities.JobPosting.update(job.id, { status });
      return Response.json({ opportunity: updated });
    }

    if (action === "reopen") {
      requireOrgAdmin(ctx);
      const job = await requireOrgOpportunity(ctx, body?.opportunity_id);
      if (job.verification_status !== "Verified") {
        throw httpError("Only verified opportunities can be reopened", 400);
      }
      const updated = await ctx.svc.entities.JobPosting.update(job.id, { status: "Active" });
      return Response.json({ opportunity: updated });
    }

    throw httpError("Unknown opportunity action", 400);
  } catch (error) {
    return orgErrorResponse(error);
  }
}