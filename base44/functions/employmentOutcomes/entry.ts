import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveOrgContext, orgErrorResponse } from '../../shared/orgAuth.ts';
import { httpError, requireOrgAdmin } from '../../shared/orgEmployerSecurity.ts';
import {
  findAttributingLink,
  validateEmploymentStartDate,
  resolveApplicationForOutcome,
  ensureNoDuplicateOutcome,
} from '../../shared/orgOutcomeSecurity.ts';

async function updateParticipantProfileForHire(svc, participantId, employerName, positionTitle, startDate) {
  const profiles = await svc.entities.UserProfile.filter(
    { created_by_id: participantId },
    "-created_date",
    1
  );
  const profile = profiles[0] || null;
  if (!profile) return;
  await svc.entities.UserProfile.update(profile.id, {
    employment_status: "Offer Accepted",
    current_employer_name: employerName || profile.current_employer_name || "",
    current_position_title: positionTitle || profile.current_position_title || "",
    offer_accepted_date: startDate,
  });
}

async function createOutcome({
  svc,
  organizationId,
  participantId,
  body,
  source,
  reportedByUserId,
  verifiedByStaffId,
}) {
  const employmentStartDate = validateEmploymentStartDate(body?.employment_start_date);
  const link = await findAttributingLink(
    svc,
    participantId,
    employmentStartDate,
    organizationId
  );
  if (!link) {
    throw httpError("Employment date does not fall within this organization connection period", 400);
  }

  const { application, job } = await resolveApplicationForOutcome(
    svc,
    participantId,
    body?.application_id
  );

  const employerName = String(
    body?.employer_name ||
    job?.employer_name ||
    application?.employer_name ||
    ""
  ).trim();
  const positionTitle = String(
    body?.position_title ||
    job?.job_title ||
    application?.job_title ||
    ""
  ).trim();

  await ensureNoDuplicateOutcome(
    svc,
    organizationId,
    participantId,
    employmentStartDate,
    employerName
  );

  const wageAmount =
    body?.wage_amount === "" || body?.wage_amount === undefined || body?.wage_amount === null
      ? undefined
      : Number(body.wage_amount);
  if (wageAmount !== undefined && (!Number.isFinite(wageAmount) || wageAmount < 0)) {
    throw httpError("Wage amount is invalid", 400);
  }

  const wagePeriod = body?.wage_period || undefined;
  const allowedWagePeriods = new Set(["hourly", "weekly", "monthly", "annual"]);
  if (wagePeriod && !allowedWagePeriods.has(wagePeriod)) {
    throw httpError("Wage period is invalid", 400);
  }

  const throughOrganizationOpportunity =
    !!job &&
    job.organization_id === organizationId &&
    !!job.org_employer_id;

  const created = await svc.entities.EmploymentOutcome.create({
    organization_id: organizationId,
    participant_id: participantId,
    application_id: application?.id || "",
    job_posting_id: job?.id || "",
    org_employer_id: throughOrganizationOpportunity ? (job.org_employer_id || "") : "",
    employer_name: employerName,
    position_title: positionTitle,
    employment_start_date: employmentStartDate,
    reported_date: new Date().toISOString(),
    outcome_type: "Hired",
    source,
    reported_by_user_id: reportedByUserId || "",
    verified_by_staff_id: verifiedByStaffId || "",
    wage_amount: wageAmount,
    wage_period: wagePeriod,
    through_organization_opportunity: throughOrganizationOpportunity,
    status: "Active",
  });

  if (application) {
    await svc.entities.Application.update(application.id, {
      status: "Hired",
      outcome: "Hired",
    });
  }

  await updateParticipantProfileForHire(
    svc,
    participantId,
    employerName,
    positionTitle,
    employmentStartDate
  );

  return created;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body?.action || "participant_record";
    const svc = base44.asServiceRole;

    if (action === "participant_record") {
      const participantId = user.id;
      const employmentStartDate = validateEmploymentStartDate(body?.employment_start_date);
      const link = await findAttributingLink(svc, participantId, employmentStartDate);

      if (!link) {
        const employerName = String(body?.employer_name || "").trim();
        const positionTitle = String(body?.position_title || "").trim();
        await updateParticipantProfileForHire(
          svc,
          participantId,
          employerName,
          positionTitle,
          employmentStartDate
        );
        return Response.json({
          recorded_for_organization: false,
          message: "Employment status updated. No organization was active on the employment start date.",
        });
      }

      const outcome = await createOutcome({
        svc,
        organizationId: link.organization_id,
        participantId,
        body,
        source: "Job Seeker Reported",
        reportedByUserId: user.id,
        verifiedByStaffId: "",
      });
      return Response.json({ outcome, recorded_for_organization: true });
    }

    if (action === "participant_retract") {
      const profiles = await svc.entities.UserProfile.filter(
        { created_by_id: user.id },
        "-created_date",
        1
      );
      const profile = profiles[0] || null;
      if (profile) {
        await svc.entities.UserProfile.update(profile.id, {
          employment_status: "Searching",
        });
      }

      const outcomes = await svc.entities.EmploymentOutcome.filter(
        { participant_id: user.id, status: "Active", source: "Job Seeker Reported" },
        "-reported_date",
        20
      );
      const latest = outcomes[0] || null;
      if (latest) {
        await svc.entities.EmploymentOutcome.update(latest.id, {
          status: "Voided",
          voided_at: new Date().toISOString(),
          void_reason: "Participant reported employment did not continue",
        });
      }

      return Response.json({ reverted: true, outcome_voided: !!latest });
    }

    const ctx = await resolveOrgContext(base44);

    if (action === "list") {
      const outcomes = await ctx.svc.entities.EmploymentOutcome.filter(
        { organization_id: ctx.organizationId, status: "Active" },
        "-employment_start_date",
        1000
      );
      const links = await ctx.svc.entities.ParticipantOrgLink.filter(
        { organization_id: ctx.organizationId },
        "-linked_at",
        1000
      );

      const participantIds = [...new Set(links.map((l) => l.participant_id))];
      const participants = [];
      for (const participantId of participantIds) {
        const profiles = await ctx.svc.entities.UserProfile.filter(
          { created_by_id: participantId },
          "-created_date",
          1
        );
        const profile = profiles[0] || null;
        participants.push({
          participant_id: participantId,
          participant_name: profile
            ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "(name not set)"
            : "(name not set)",
          active: links.some((l) => l.participant_id === participantId && l.status === "active"),
        });
      }

      const nameByParticipant = new Map(
        participants.map((p) => [p.participant_id, p.participant_name])
      );
      return Response.json({
        outcomes: outcomes.map((o) => ({
          ...o,
          participant_name: nameByParticipant.get(o.participant_id) || "(name not set)",
        })),
        participants,
      });
    }

    if (action === "staff_record") {
      const participantId = String(body?.participant_id || "").trim();
      if (!participantId) throw httpError("Participant id is required", 400);
      if (!String(body?.employer_name || "").trim()) {
        throw httpError("Employer name is required for staff-recorded outcomes", 400);
      }

      const source = body?.source || "Staff Verified";
      if (!["Staff Verified", "Employer Confirmed"].includes(source)) {
        throw httpError("Invalid outcome source", 400);
      }

      const outcome = await createOutcome({
        svc: ctx.svc,
        organizationId: ctx.organizationId,
        participantId,
        body,
        source,
        reportedByUserId: "",
        verifiedByStaffId: ctx.staffAccount.id,
      });
      return Response.json({ outcome });
    }

    if (action === "verify") {
      const outcomeId = body?.outcome_id;
      if (!outcomeId) throw httpError("Outcome id is required", 400);

      let outcome = null;
      try {
        outcome = await ctx.svc.entities.EmploymentOutcome.get(outcomeId);
      } catch (_) {}
      if (!outcome || outcome.organization_id !== ctx.organizationId || outcome.status !== "Active") {
        throw httpError("Outcome not found", 404);
      }

      const source = body?.source || "Staff Verified";
      if (!["Staff Verified", "Employer Confirmed"].includes(source)) {
        throw httpError("Invalid verification source", 400);
      }

      const updated = await ctx.svc.entities.EmploymentOutcome.update(outcome.id, {
        source,
        verified_by_staff_id: ctx.staffAccount.id,
      });
      return Response.json({ outcome: updated });
    }

    if (action === "void") {
      requireOrgAdmin(ctx);
      const outcomeId = body?.outcome_id;
      const reason = String(body?.reason || "").trim();
      if (!outcomeId) throw httpError("Outcome id is required", 400);
      if (!reason) throw httpError("Void reason is required", 400);

      let outcome = null;
      try {
        outcome = await ctx.svc.entities.EmploymentOutcome.get(outcomeId);
      } catch (_) {}
      if (!outcome || outcome.organization_id !== ctx.organizationId || outcome.status !== "Active") {
        throw httpError("Outcome not found", 404);
      }

      const updated = await ctx.svc.entities.EmploymentOutcome.update(outcome.id, {
        status: "Voided",
        voided_at: new Date().toISOString(),
        voided_by_staff_id: ctx.staffAccount.id,
        void_reason: reason,
      });
      return Response.json({ outcome: updated });
    }

    throw httpError("Unknown employment outcome action", 400);
  } catch (error) {
    if (error?.status) return Response.json({ error: error.message }, { status: error.status });
    return orgErrorResponse(error);
  }
}