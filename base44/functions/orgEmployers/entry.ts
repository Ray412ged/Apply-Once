import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveOrgContext, orgErrorResponse } from '../../shared/orgAuth.ts';
import {
  normalizeEmployerName,
  httpError,
  requireOrgAdmin,
  requireOrgEmployer,
  requireActiveOrgStaff,
  canEditEmployer,
} from '../../shared/orgEmployerSecurity.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const ctx = await resolveOrgContext(base44);
    const body = await req.json().catch(() => ({}));
    const action = body?.action || "list";

    if (action === "list") {
      const employers = await ctx.svc.entities.OrgEmployer.filter(
        { organization_id: ctx.organizationId },
        "-last_activity_date",
        500
      );
      const contacts = await ctx.svc.entities.EmployerContact.filter(
        { organization_id: ctx.organizationId },
        "-created_date",
        1000
      );
      const activities = await ctx.svc.entities.EmployerActivity.filter(
        { organization_id: ctx.organizationId },
        "-activity_date",
        2000
      );
      const staffRows = await ctx.svc.entities.OrganizationStaffAccount.filter(
        { organization_id: ctx.organizationId, active: true },
        "display_name",
        500
      );

      const activeStaffAccountIds = new Set(staffRows.map((s) => s.id));
      const activeStaffUserIds = new Set(staffRows.map((s) => s.user_id));
      const cutoff12mo = Date.now() - 365 * 24 * 60 * 60 * 1000;
      const cutoff90d = Date.now() - 90 * 24 * 60 * 60 * 1000;

      const enriched = employers.map((employer) => {
        const employerContacts = contacts.filter((c) => c.employer_id === employer.id && c.status !== "Inactive");
        const employerActivities = activities.filter((a) => a.employer_id === employer.id);
        const connectedStaff = new Set();

        if (
          employer.relationship_owner_staff_id &&
          activeStaffAccountIds.has(employer.relationship_owner_staff_id)
        ) connectedStaff.add(employer.relationship_owner_staff_id);

        for (const contact of employerContacts) {
          if (contact.relationship_owner_staff_id && activeStaffAccountIds.has(contact.relationship_owner_staff_id)) {
            connectedStaff.add(contact.relationship_owner_staff_id);
          }
        }

        for (const activity of employerActivities) {
          const t = new Date(activity.activity_date).getTime();
          if (Number.isFinite(t) && t >= cutoff12mo && activeStaffUserIds.has(activity.staff_user_id)) {
            const staff = staffRows.find((s) => s.user_id === activity.staff_user_id);
            if (staff) connectedStaff.add(staff.id);
          }
        }

        const recentActivity = employerActivities.some((a) => {
          const t = new Date(a.activity_date).getTime();
          return Number.isFinite(t) && t >= cutoff90d;
        });

        const openNextSteps = employerActivities.filter(
          (a) => a.next_step && !a.next_step_done
        ).length;

        return {
          ...employer,
          contact_count: employerContacts.length,
          connected_staff_count: connectedStaff.size,
          continuity_risk: connectedStaff.size <= 1,
          recent_activity: recentActivity,
          open_next_steps: openNextSteps,
        };
      });

      return Response.json({
        employers: enriched,
        staff: staffRows.map((s) => ({
          id: s.id,
          display_name: s.display_name || "Staff",
        })),
      });
    }

    if (action === "get") {
      const employer = await requireOrgEmployer(ctx, body?.employer_id);
      return Response.json({ employer });
    }

    if (action === "create") {
      const employerName = String(body?.employer_name || "").trim();
      if (!employerName) throw httpError("Employer name is required", 400);

      const normalizedName = normalizeEmployerName(employerName);
      const dupes = await ctx.svc.entities.OrgEmployer.filter(
        { organization_id: ctx.organizationId, normalized_name: normalizedName },
        "-created_date",
        10
      );
      if (dupes.length > 0 && !body?.confirm_duplicate) {
        return Response.json(
          {
            duplicate_warning: true,
            matches: dupes.map((e) => ({
              id: e.id,
              employer_name: e.employer_name,
              status: e.status,
            })),
          },
          { status: 409 }
        );
      }

      const ownerStaffId =
        ctx.orgRole === "org_admin"
          ? (body?.relationship_owner_staff_id || ctx.staffAccount.id)
          : ctx.staffAccount.id;
      await requireActiveOrgStaff(ctx, ownerStaffId);

      const requestedStatus = body?.status || "Lead";
      const status =
        ctx.orgRole === "org_admin"
          ? requestedStatus
          : "Lead";

      const created = await ctx.svc.entities.OrgEmployer.create({
        organization_id: ctx.organizationId,
        employer_name: employerName,
        normalized_name: normalizedName,
        industry: body?.industry || "",
        website_url: body?.website_url || "",
        city: body?.city || "",
        state: body?.state || "",
        postal_code: body?.postal_code || "",
        status,
        relationship_owner_staff_id: ownerStaffId,
        notes: body?.notes || "",
        created_by_staff_id: ctx.staffAccount.id,
        source: body?.source || "Staff Entry",
      });

      return Response.json({ employer: created });
    }

    if (action === "update") {
      const employer = await requireOrgEmployer(ctx, body?.employer_id);
      if (!canEditEmployer(ctx, employer)) {
        throw httpError("You do not have permission to edit this employer", 403);
      }

      const updates = {};
      if (body?.employer_name !== undefined) {
        const name = String(body.employer_name || "").trim();
        if (!name) throw httpError("Employer name is required", 400);
        const normalizedName = normalizeEmployerName(name);
        const dupes = await ctx.svc.entities.OrgEmployer.filter(
          { organization_id: ctx.organizationId, normalized_name: normalizedName },
          "-created_date",
          10
        );
        const other = dupes.filter((e) => e.id !== employer.id);
        if (other.length > 0 && !body?.confirm_duplicate) {
          return Response.json(
            {
              duplicate_warning: true,
              matches: other.map((e) => ({
                id: e.id,
                employer_name: e.employer_name,
                status: e.status,
              })),
            },
            { status: 409 }
          );
        }
        updates.employer_name = name;
        updates.normalized_name = normalizedName;
      }

      for (const field of ["industry", "website_url", "city", "state", "postal_code", "notes"]) {
        if (body?.[field] !== undefined) updates[field] = body[field];
      }

      if (body?.relationship_owner_staff_id !== undefined) {
        const requestedOwner = body.relationship_owner_staff_id;
        const isReassignment = requestedOwner !== employer.relationship_owner_staff_id;
        if (ctx.orgRole !== "org_admin" && isReassignment) {
          throw httpError("Only an organization admin can reassign employer ownership", 403);
        }
        if (isReassignment) {
          await requireActiveOrgStaff(ctx, requestedOwner);
          updates.relationship_owner_staff_id = requestedOwner;
        }
      }

      if (body?.status !== undefined) {
        if (ctx.orgRole !== "org_admin" && body.status !== employer.status) {
          throw httpError("Only an organization admin can change employer status", 403);
        }
        updates.status = body.status;
      }

      const updated = await ctx.svc.entities.OrgEmployer.update(employer.id, updates);
      return Response.json({ employer: updated });
    }

    if (action === "archive") {
      requireOrgAdmin(ctx);
      const employer = await requireOrgEmployer(ctx, body?.employer_id);
      const updated = await ctx.svc.entities.OrgEmployer.update(employer.id, { status: "Archived" });
      return Response.json({ employer: updated });
    }

    throw httpError("Unknown employer action", 400);
  } catch (error) {
    return orgErrorResponse(error);
  }
}