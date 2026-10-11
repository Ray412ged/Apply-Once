import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveOrgContext, orgErrorResponse } from '../../shared/orgAuth.ts';
import {
  isCoreProfileComplete,
  getParticipantStatus,
  getParticipantMomentum,
  STATUS,
  MOMENTUM,
  MOMENTUM_WINDOW_DAYS,
  NEEDS_ENCOURAGEMENT_INACTIVITY_DAYS,
} from '../../shared/participantStatus.ts';

// Organizational Dashboard data function. Resolves the caller's org via
// OrganizationStaffAccount (never a user-editable field), then returns ONLY
// status categories, momentum, and the approved aggregate metrics for that
// org's active participants — never raw profile content, section
// breakdowns, or a precise 0-100 readiness score.
//
// KNOWN SCOPE LIMITATION: "average profile completion" here is the
// percentage of participants who pass the coarse core-profile-complete gate
// (see participantStatus.ts), not the Employment Intelligence Engine's
// precise weighted 0-100 score — that engine lives in src/lib/ and cannot be
// imported into this Deno function (see participantStatus.ts header for why).
// A more precise number would require the participant's own client to write
// a small derived snapshot after computing it locally; deliberately not
// built in this pass — flagging for a follow-up decision rather than silently
// shipping a number that looks more precise than it is.
//
// Explicitly excluded, permanently, per product direction: no "jobs viewed"
// or "jobs saved" data is read or returned anywhere in this function.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { svc, organizationId } = await resolveOrgContext(base44);

    const links = await svc.entities.ParticipantOrgLink.filter(
      { organization_id: organizationId, status: 'active' },
      '-linked_at',
      500
    );

    const participantIds = links.map((l) => l.participant_id);
    if (participantIds.length === 0) {
      return Response.json({
        organization_id: organizationId,
        total_active_participants: 0,
        by_status: { [STATUS.BUILDING_PROFILE]: 0, [STATUS.NEEDS_ENCOURAGEMENT]: 0, [STATUS.READY_TO_APPLY]: 0, [STATUS.EMPLOYED]: 0 },
        by_momentum: { [MOMENTUM.BUILDING]: 0, [MOMENTUM.MAINTAINING]: 0, [MOMENTUM.SLOWING]: 0 },
        applications_submitted_this_week: 0,
        inactive_14_plus_days: 0,
        average_profile_completion_pct: 0,
        program_career_interests: [],
        program_industry_interests: [],
        participants: [],
      });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgo = new Date(Date.now() - MOMENTUM_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const byStatus = { [STATUS.BUILDING_PROFILE]: 0, [STATUS.NEEDS_ENCOURAGEMENT]: 0, [STATUS.READY_TO_APPLY]: 0, [STATUS.EMPLOYED]: 0 };
    const byMomentum = { [MOMENTUM.BUILDING]: 0, [MOMENTUM.MAINTAINING]: 0, [MOMENTUM.SLOWING]: 0 };
    let coreCompleteCount = 0;
    let nonEmployedCount = 0;
    let inactive14PlusCount = 0;
    let applicationsThisWeek = 0;
    const careerInterestCounts = {};
    const industryInterestCounts = {};
    const participantsOut = [];

    for (const participantId of participantIds) {
      const [profiles, employment, skills, activityEvents, applications, jobPrefs] = await Promise.all([
        svc.entities.UserProfile.filter({ created_by_id: participantId }, '-created_date', 1),
        svc.entities.EmploymentRecord.filter({ created_by_id: participantId }, '-created_date', 50),
        svc.entities.Skill.filter({ created_by_id: participantId }, '-created_date', 50),
        svc.entities.ParticipantActivityEvent.filter(
          { participant_id: participantId, timestamp: { $gte: fourteenDaysAgo } },
          '-timestamp',
          200
        ),
        svc.entities.Application.filter(
          { created_by_id: participantId, application_submitted_date: { $gte: sevenDaysAgo } },
          '-application_submitted_date',
          50
        ),
        svc.entities.JobPreference.filter({ created_by_id: participantId }, '-created_date', 1),
      ]);

      const profile = profiles[0] || null;
      const isComplete = isCoreProfileComplete({ profile, employment, skills });
      const status = getParticipantStatus(isComplete, activityEvents, profile?.employment_status);
      const momentum = getParticipantMomentum(activityEvents);
      const isEmployed = status === STATUS.EMPLOYED;

      byStatus[status] = (byStatus[status] || 0) + 1;
      byMomentum[momentum] = (byMomentum[momentum] || 0) + 1;
      // Completion and inactivity are job-search-pipeline metrics — an
      // employed participant is a positive outcome, not someone who's
      // "behind" on a profile they no longer need to keep building.
      if (!isEmployed) {
        if (isComplete) coreCompleteCount++;
        nonEmployedCount++;
      }

      const mostRecent = activityEvents.reduce((latest, e) => {
        const t = new Date(e.timestamp).getTime();
        return Number.isFinite(t) && t > latest ? t : latest;
      }, 0);
      const daysSinceActivity = mostRecent ? (Date.now() - mostRecent) / (1000 * 60 * 60 * 24) : Infinity;
      if (!isEmployed && daysSinceActivity >= 14) inactive14PlusCount++;

      applicationsThisWeek += applications.length;

      const prefs = jobPrefs[0];
      (prefs?.desired_job_titles || []).forEach((t) => {
        careerInterestCounts[t] = (careerInterestCounts[t] || 0) + 1;
      });
      (prefs?.desired_industries || []).forEach((i) => {
        industryInterestCounts[i] = (industryInterestCounts[i] || 0) + 1;
      });

      participantsOut.push({
        participant_id: participantId,
        participant_name: profile
          ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "(name not set)"
          : "(name not set)",
        status,
        momentum,
        days_since_last_activity:
          daysSinceActivity === Infinity ? null : Math.round(daysSinceActivity * 10) / 10,
        ...(isEmployed && {
          employer_name: profile?.current_employer_name || null,
          position_title: profile?.current_position_title || null,
        }),
      });
    }

    const topEntries = (counts, n = 5) =>
      Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([label, count]) => ({ label, count }));

    return Response.json({
      organization_id: organizationId,
      total_active_participants: participantIds.length,
      by_status: byStatus,
      by_momentum: byMomentum,
      applications_submitted_this_week: applicationsThisWeek,
      inactive_14_plus_days: inactive14PlusCount,
      average_profile_completion_pct:
        nonEmployedCount > 0 ? Math.round((coreCompleteCount / nonEmployedCount) * 100) : 0,
      program_career_interests: topEntries(careerInterestCounts),
      program_industry_interests: topEntries(industryInterestCounts),
      participants: participantsOut,
    });
  } catch (error) {
    return orgErrorResponse(error);
  }
}