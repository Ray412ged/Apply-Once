import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveOrgContext, orgErrorResponse } from '../../shared/orgAuth.ts';
import { requireOrgAdmin, httpError } from '../../shared/orgEmployerSecurity.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const ctx = await resolveOrgContext(base44);
    requireOrgAdmin(ctx);
    const body = await req.json().catch(() => ({}));
    const participantId = String(body?.participant_id || "").trim();
    if (!participantId) throw httpError("Participant id is required", 400);

    const links = await ctx.svc.entities.ParticipantOrgLink.filter(
      { participant_id: participantId, organization_id: ctx.organizationId, status: "active" },
      "-linked_at",
      2
    );
    if (links.length === 0) throw httpError("Participant not found in this organization", 404);

    const [profiles, docs, applications, activity, referrals] = await Promise.all([
      ctx.svc.entities.UserProfile.filter({ created_by_id: participantId }, "-created_date", 1),
      ctx.svc.entities.UserDocument.filter({ created_by_id: participantId }, "-created_date", 100),
      ctx.svc.entities.Application.filter({ created_by_id: participantId }, "-updated_date", 100),
      ctx.svc.entities.ParticipantActivityEvent.filter({ participant_id: participantId }, "-timestamp", 100),
      ctx.svc.entities.OrgParticipantReferral.filter(
        { organization_id: ctx.organizationId, participant_id: participantId },
        "-claimed_at",
        5
      ),
    ]);

    const profile = profiles[0] || null;
    const referral = referrals[0] || null;
    const hasResume = docs.some((d) => d.document_type === "Resume") || !!profile?.last_resume_signature;
    const lastActivityAt = activity
      .map((a) => a.timestamp)
      .filter(Boolean)
      .sort()
      .reverse()[0] || null;

    return Response.json({
      participant: {
        participant_id: participantId,
        name: profile ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") : (referral?.participant_name || "Participant"),
        email: referral?.email || profile?.email || "",
        phone: referral?.phone || profile?.phone || "",
        referring_staff: referral?.referring_staff || "",
        onboarding_status: profile?.onboarding_status || "not_started",
        profile_completion_percentage: Number(profile?.profile_completion_percentage || 0),
        resume_ready: hasResume,
        employment_status: profile?.employment_status || "Searching",
        current_employer_name: profile?.current_employer_name || "",
        current_position_title: profile?.current_position_title || "",
        joined_at: links[0]?.linked_at || referral?.claimed_at || null,
        last_activity_at: lastActivityAt,
      },
      applications: applications.map((a) => ({
        id: a.id,
        job_title: a.job_title || "",
        employer_name: a.employer_name || "",
        status: a.status || "",
        application_submitted_date: a.application_submitted_date || null,
        updated_date: a.updated_date || null,
      })),
    });
  } catch (error) {
    return orgErrorResponse(error);
  }
}