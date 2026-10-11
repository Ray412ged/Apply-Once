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
    const err = new Error("No active organization staff assignment for this account");
    err.status = 403;
    throw err;
  }

  // v0.1 intentionally supports one active organization staff assignment.
  const staffAccount = staffRows[0];
  return {
    user,
    svc,
    organizationId: staffAccount.organization_id,
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