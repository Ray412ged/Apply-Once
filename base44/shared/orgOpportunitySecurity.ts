import { httpError, requireOrgEmployer } from "./orgEmployerSecurity.ts";

const TYPES = new Set(["Job", "Apprenticeship", "Work Experience"]);
const EMPLOYMENT_TYPES = new Set(["Full-time", "Part-time", "Temporary", "Contract", "Seasonal", "Internship"]);
const REMOTE_TYPES = new Set(["On-site", "Hybrid", "Remote", "Not specified"]);
const APPLICATION_METHODS = new Set([
  "External website",
  "Email employer",
  "Call employer",
  "Apply in person",
  "Employer instructions",
  "Future Apply Once employer application",
]);

export function isOpportunityOwner(ctx, job) {
  return job?.submitted_by_staff_id === ctx.staffAccount.id;
}

export function canEditOpportunity(ctx, job) {
  if (ctx.orgRole === "org_admin") return true;
  return isOpportunityOwner(ctx, job) &&
    job.status === "Draft" &&
    ["Unverified", "Returned"].includes(job.verification_status || "Unverified");
}

export function canCloseOpportunity(ctx, job) {
  if (ctx.orgRole === "org_admin") return true;
  return isOpportunityOwner(ctx, job) &&
    job.verification_status === "Verified" &&
    job.status === "Active";
}

export async function requireOrgOpportunity(ctx, jobId) {
  if (!jobId) throw httpError("Opportunity id is required", 400);
  let job = null;
  try {
    job = await ctx.svc.entities.JobPosting.get(jobId);
  } catch (_) {
    job = null;
  }
  if (!job || job.organization_id !== ctx.organizationId) {
    throw httpError("Opportunity not found", 404);
  }
  return job;
}

export async function validateOpportunityInput(ctx, body, existing = null) {
  const updates = {};

  if (!existing || body?.org_employer_id !== undefined) {
    const employerId = body?.org_employer_id || existing?.org_employer_id;
    const employer = await requireOrgEmployer(ctx, employerId);
    if (employer.status === "Archived") {
      throw httpError("Archived employers cannot have new opportunities", 400);
    }
    updates.org_employer_id = employer.id;
    updates.employer_name = employer.employer_name;
    updates.industry = body?.industry !== undefined ? body.industry : (existing?.industry || employer.industry || "");
    updates.company_website = body?.company_website !== undefined ? body.company_website : (existing?.company_website || employer.website_url || "");
    updates.city = body?.city !== undefined ? body.city : (existing?.city || employer.city || "");
    updates.state = body?.state !== undefined ? body.state : (existing?.state || employer.state || "");
    updates.postal_code = body?.postal_code !== undefined ? body.postal_code : (existing?.postal_code || employer.postal_code || "");
  }

  if (!existing || body?.job_title !== undefined) {
    const title = String(body?.job_title ?? existing?.job_title ?? "").trim();
    if (!title) throw httpError("Opportunity title is required", 400);
    updates.job_title = title;
  }

  if (!existing || body?.opportunity_type !== undefined) {
    const type = body?.opportunity_type ?? existing?.opportunity_type ?? "Job";
    if (!TYPES.has(type)) throw httpError("Invalid opportunity type", 400);
    updates.opportunity_type = type;
  }

  if (body?.employment_type !== undefined) {
    if (body.employment_type && !EMPLOYMENT_TYPES.has(body.employment_type)) {
      throw httpError("Invalid employment type", 400);
    }
    updates.employment_type = body.employment_type || undefined;
  }

  if (body?.remote_type !== undefined) {
    if (!REMOTE_TYPES.has(body.remote_type)) throw httpError("Invalid remote type", 400);
    updates.remote_type = body.remote_type;
  }

  if (body?.application_method !== undefined) {
    if (body.application_method && !APPLICATION_METHODS.has(body.application_method)) {
      throw httpError("Invalid application method", 400);
    }
    updates.application_method = body.application_method || undefined;
  }

  for (const field of [
    "location", "salary_text", "schedule", "full_description",
    "minimum_qualifications", "preferred_qualifications",
    "required_education", "required_experience", "required_credentials",
    "application_url", "application_email", "application_phone",
    "application_instructions", "background_requirements"
  ]) {
    if (body?.[field] !== undefined) updates[field] = body[field];
  }

  if (body?.application_url !== undefined) {
    updates.posting_url = body.application_url || "";
  }

  for (const field of ["number_of_openings", "salary_min", "salary_max"]) {
    if (body?.[field] !== undefined) {
      const value = body[field];
      updates[field] = value === "" || value === null ? undefined : Number(value);
      if (updates[field] !== undefined && !Number.isFinite(updates[field])) {
        throw httpError(`Invalid value for ${field}`, 400);
      }
    }
  }

  for (const field of ["second_chance_friendly", "apprenticeship_available"]) {
    if (body?.[field] !== undefined) updates[field] = !!body[field];
  }

  for (const field of ["application_deadline", "expiration_date"]) {
    if (body?.[field] !== undefined) {
      const value = body[field] || "";
      if (value) {
        const t = new Date(value + "T12:00:00").getTime();
        if (!Number.isFinite(t)) throw httpError(`Invalid ${field.replaceAll("_", " ")}`, 400);
      }
      updates[field] = value || undefined;
    }
  }

  return updates;
}