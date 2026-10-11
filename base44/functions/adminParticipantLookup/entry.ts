import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Admin row-level participant lookup.
// Enforces: (1) caller must be admin, (2) a non-empty `reason` is required,
// (3) an AdminAccessLog row is written as part of the SAME operation before
// any participant data is returned. The audit write is NOT left to the caller.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const participantId = body?.participant_id;
    const reason = (body?.reason || '').toString().trim();

    if (!participantId) {
      return Response.json({ error: 'participant_id is required' }, { status: 400 });
    }
    if (!reason) {
      return Response.json({ error: 'A reason is required for row-level participant access' }, { status: 400 });
    }

    const svc = base44.asServiceRole;

    // Pull the participant's profile, org links, and activity events.
    const [profileList, orgLinks, activity] = await Promise.all([
      svc.entities.UserProfile.filter({ created_by_id: participantId }, '-created_date', 1),
      svc.entities.ParticipantOrgLink.filter({ participant_id: participantId }, '-linked_at', 100),
      svc.entities.ParticipantActivityEvent.filter({ participant_id: participantId }, '-timestamp', 200),
    ]);

    const activeLink = orgLinks.find((l) => l.status === 'active');
    const organizationId = activeLink?.organization_id || null;

    // Audit write — same operation, before returning data.
    await svc.entities.AdminAccessLog.create({
      admin_id: user.id,
      participant_id: participantId,
      organization_id: organizationId,
      reason,
      timestamp: new Date().toISOString(),
    });

    return Response.json({
      participant_id: participantId,
      reason,
      profile: profileList[0] || null,
      organization_links: orgLinks,
      activity_events: activity,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}