import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveOrgContext, orgErrorResponse } from '../../shared/orgAuth.ts';

// Returns the calling org staff member's own organization's active
// ParticipantOrgLink rows. Org identity is resolved via OrganizationStaffAccount
// — an entity only an admin can create — never via a user-editable field.
// (ParticipantOrgLink's RLS no longer has any organization-scoped read branch
// at all, so this function is the only path to org-scoped participant data.)
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { svc, organizationId } = await resolveOrgContext(base44);

    const links = await svc.entities.ParticipantOrgLink.filter(
      { organization_id: organizationId, status: 'active' },
      '-linked_at',
      500
    );

    return Response.json({
      organization_id: organizationId,
      active_participant_links: links,
    });
  } catch (error) {
    return orgErrorResponse(error);
  }
}