import { httpError } from "./orgEmployerSecurity.ts";

export function dateInsideLink(link, dateValue) {
  const t = new Date(dateValue + "T12:00:00").getTime();
  const start = new Date(link?.linked_at).getTime();
  const end = link?.revoked_at ? new Date(link.revoked_at).getTime() : Infinity;
  return Number.isFinite(t) && Number.isFinite(start) && t >= start && t <= end;
}

export async function findAttributingLink(svc, participantId, employmentStartDate, organizationId = null) {
  const links = await svc.entities.ParticipantOrgLink.filter(
    { participant_id: participantId },
    "linked_at",
    100
  );
  return links.find((link) =>
    (!organizationId || link.organization_id === organizationId) &&
    dateInsideLink(link, employmentStartDate)
  ) || null;
}

export function validateEmploymentStartDate(value) {
  const text = String(value || "").trim();
  if (!text) throw httpError("Employment start date is required", 400);
  const t = new Date(text + "T12:00:00").getTime();
  if (!Number.isFinite(t)) throw httpError("Employment start date is invalid", 400);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (t > today.getTime()) throw httpError("Employment start date cannot be in the future", 400);
  return text;
}

export async function resolveApplicationForOutcome(svc, participantId, applicationId) {
  if (!applicationId) return { application: null, job: null };
  let application = null;
  try {
    application = await svc.entities.Application.get(applicationId);
  } catch (_) {}
  if (!application || application.created_by_id !== participantId) {
    throw httpError("Application not found", 404);
  }

  let job = null;
  try {
    job = await svc.entities.JobPosting.get(application.job_posting_id);
  } catch (_) {}
  return { application, job };
}

export async function ensureNoDuplicateOutcome(svc, organizationId, participantId, employmentStartDate, employerName) {
  const rows = await svc.entities.EmploymentOutcome.filter(
    { organization_id: organizationId, participant_id: participantId, status: "Active" },
    "-reported_date",
    100
  );
  const normalizedEmployer = String(employerName || "").trim().toLowerCase();
  const duplicate = rows.find((row) =>
    row.employment_start_date === employmentStartDate &&
    String(row.employer_name || "").trim().toLowerCase() === normalizedEmployer
  );
  if (duplicate) throw httpError("This employment outcome has already been recorded", 409);
}