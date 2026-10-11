import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Marks a participant's own post-engagement follow-up as answered — either
// because they tapped "Still searching" or because they confirmed
// employment via the same flow. Never restores organization access, never
// reopens profile visibility to the org — this only stops the one-time
// check-in prompt from showing again for this specific (revoked) link.
//
// Participant-only: a caller may only mark their OWN link answered. Admins
// are not given a bypass here since there's no legitimate admin use case
// for marking someone else's follow-up as answered on their behalf.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const linkId = body?.link_id;
    if (!linkId) return Response.json({ error: 'link_id is required' }, { status: 400 });

    const svc = base44.asServiceRole;
    const link = await svc.entities.ParticipantOrgLink.get(linkId);
    if (!link || link.participant_id !== user.id) {
      return Response.json({ error: 'You can only answer your own follow-up' }, { status: 403 });
    }

    const updated = await svc.entities.ParticipantOrgLink.update(linkId, {
      followup_checkin_answered: true,
    });

    return Response.json({ updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}