/**
 * Resolves the signed-in user's active organization staff assignment.
 * Organization identity is derived server-side from OrganizationStaffAccount;
 * callers never supply a trusted organization_id.
 */
export async function resolveOrgContext(base44) {
  const user = await base44.auth.me();
  if (!user) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }

  const svc = base44.asServiceRole;
  const staffRows = await svc.entities.OrganizationStaffAccount.filter(
    { user_id: user.id, active: true },
    "-created_date",
    2
  );

  if (staffRows.length === 0) {
    const err = new Error("No active Auberle Employment Institute staff seat for this account");
    err.status = 403;
    throw err;
  }

  if (staffRows.length > 1) {
    const err = new Error("Multiple active Auberle Employment Institute staff seats were found for this account");
    err.status = 409;
    throw err;
  }

  const staffAccount = staffRows[0];
  const orgs = await svc.entities.Organization.filter(
    { id: staffAccount.organization_id },
    "-created_date",
    1
  );
  const organization = orgs[0] || null;

  if (!organization || organization.active === false) {
    const err = new Error("Auberle Employment Institute workspace is inactive or unavailable");
    err.status = 403;
    throw err;
  }

  return {
    user,
    svc,
    organizationId: staffAccount.organization_id,
    organization,
    orgRole: staffAccount.org_role || "staff",
    staffAccount,
  };
}

export function orgErrorResponse(error) {
  const status = Number(error?.status) || 500;
  return Response.json(
    { error: error?.message || "Unexpected organization access error" },
    { status }
  );
}