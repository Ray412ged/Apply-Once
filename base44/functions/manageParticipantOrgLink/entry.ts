import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Creates or revokes a ParticipantOrgLink, enforcing the single-active-link
// invariant at the backend level: a participant may hold at most one
// status="active" link at a time. Creating a second active link fails unless
// `replace_existing` is true, in which case the prior link is revoked in the
// SAME operation before the new active link is created.
//
// Authorization (Phase 2): an admin may act on any participant, and a
// participant may act on their own link (participant_id == their own user id).
// Non-admins acting on another participant's link are rejected. All writes go
// through the service role so the sentinel "system_only" RLS rules on
// ParticipantOrgLink are bypassed here, while no app user can create/modify a
// link directly via the SDK. The uniqueness / replace_existing logic is
// unchanged from Phase 1.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const participantId = body?.participant_id;
    const organizationId = body?.organization_id;
    const action = body?.action || 'create';
    const consentScope = body?.consent_scope || '';
    const followup = !!body?.post_engagement_followup_consent;

    // Authorization: admin may act on anyone; a non-admin may only act on
    // their own link.
    if (user.role !== 'admin' && participantId !== user.id) {
      return Response.json({ error: 'You can only manage your own organization link' }, { status: 403 });
    }

    if (!participantId || !organizationId) {
      return Response.json({ error: 'participant_id and organization_id are required' }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    const existing = await svc.entities.ParticipantOrgLink.filter(
      { participant_id: participantId, status: 'active' },
      '-linked_at',
      10
    );

    if (action === 'revoke') {
      if (existing.length === 0) {
        return Response.json({ error: 'No active link to revoke' }, { status: 400 });
      }
      const now = new Date().toISOString();
      for (const link of existing) {
        await svc.entities.ParticipantOrgLink.update(link.id, { status: 'revoked', revoked_at: now });
      }
      return Response.json({ revoked: existing.length });
    }

    // action === 'create'
    if (existing.length > 0 && !body?.replace_existing) {
      return Response.json(
        {
          error:
            'Participant already has an active organization link. Revoke it first, or set replace_existing=true to close the prior link and create a new one in the same operation.',
        },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    if (existing.length > 0) {
      // Close the prior active link(s) in the same operation.
      for (const link of existing) {
        await svc.entities.ParticipantOrgLink.update(link.id, { status: 'revoked', revoked_at: now });
      }
    }

    const created = await svc.entities.ParticipantOrgLink.create({
      participant_id: participantId,
      organization_id: organizationId,
      status: 'active',
      linked_at: now,
      consent_scope: consentScope,
      post_engagement_followup_consent: followup,
    });

    return Response.json({ created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}