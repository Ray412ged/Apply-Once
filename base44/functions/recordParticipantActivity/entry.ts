import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Records a ParticipantActivityEvent. This is the single entry point for the
// time-series activity log; it starts recording from deployment (no backfill).
// `participant_id` defaults to the calling user; an admin may pass an explicit
// id. Wiring this into existing flows (login, profile completion, resume
// generation, application submission) is a later phase — this function is the
// ready-to-call recorder.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const eventType = body?.event_type;
    const validTypes = ['login', 'profile_section_completed', 'resume_generated', 'application_submitted'];
    if (!validTypes.includes(eventType)) {
      return Response.json({ error: 'Invalid or missing event_type' }, { status: 400 });
    }

    const participantId = (body?.participant_id || user.id).toString();

    const svc = base44.asServiceRole;
    const created = await svc.entities.ParticipantActivityEvent.create({
      participant_id: participantId,
      event_type: eventType,
      timestamp: new Date().toISOString(),
    });

    return Response.json({ created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}