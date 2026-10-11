/**
 * Participant-side organization resolver for job visibility.
 * Returns null when the user is not connected to an active organization.
 * Rejects ambiguous multiple active links rather than silently picking one.
 */
export async function resolveJobSeekerOrg(base44, user) {
  if (!user) return null;

  const svc = base44.asServiceRole;
  const links = await svc.entities.ParticipantOrgLink.filter(
    { participant_id: user.id, status: "active" },
    "-linked_at",
    2
  );

  if (links.length === 0) return null;

  if (links.length > 1) {
    const err = new Error("Multiple active organization connections found for this account");
    err.status = 409;
    throw err;
  }

  const link = links[0];
  const orgs = await svc.entities.Organization.filter(
    { id: link.organization_id },
    "-created_date",
    1
  );
  const organization = orgs[0] || null;

  if (!organization || organization.active === false) return null;

  return {
    organizationId: link.organization_id,
    organization,
    link,
  };
}