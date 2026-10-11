import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveOrgContext, orgErrorResponse } from '../../shared/orgAuth.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { organizationId, orgRole, staffAccount, svc } = await resolveOrgContext(base44);
    const orgs = await svc.entities.Organization.filter({ id: organizationId }, "-created_date", 1);
    return Response.json({
      organization_id: organizationId,
      org_role: orgRole,
      staff: {
        id: staffAccount.id,
        display_name: staffAccount.display_name || null,
        email: staffAccount.email || null,
      },
      organization: orgs[0] || null,
    });
  } catch (error) {
    return orgErrorResponse(error);
  }
}