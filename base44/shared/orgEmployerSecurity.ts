export function normalizeEmployerName(name = "") {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function httpError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export function requireOrgAdmin(ctx) {
  if (ctx.orgRole !== "org_admin") {
    throw httpError("Organization admin access required", 403);
  }
}

export async function requireOrgEmployer(ctx, employerId) {
  if (!employerId) throw httpError("Employer id is required", 400);
  const employer = await ctx.svc.entities.OrgEmployer.get(employerId);
  if (!employer || employer.organization_id !== ctx.organizationId) {
    throw httpError("Employer not found", 404);
  }
  return employer;
}

export async function requireOrgContact(ctx, contactId) {
  if (!contactId) throw httpError("Contact id is required", 400);
  const contact = await ctx.svc.entities.EmployerContact.get(contactId);
  if (!contact || contact.organization_id !== ctx.organizationId) {
    throw httpError("Contact not found", 404);
  }
  return contact;
}

export async function requireActiveOrgStaff(ctx, staffId) {
  if (!staffId) return null;
  const rows = await ctx.svc.entities.OrganizationStaffAccount.filter(
    { id: staffId, organization_id: ctx.organizationId, active: true },
    "-created_date",
    1
  );
  const staff = rows[0] || null;
  if (!staff) throw httpError("Staff member not found", 404);
  return staff;
}

export function canEditEmployer(ctx, employer) {
  if (ctx.orgRole === "org_admin") return true;
  if (employer.status === "Lead" && employer.created_by_staff_id === ctx.staffAccount.id) return true;
  return employer.relationship_owner_staff_id === ctx.staffAccount.id;
}