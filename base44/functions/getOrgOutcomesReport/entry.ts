import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveOrgContext, orgErrorResponse } from '../../shared/orgAuth.ts';
import { isCoreProfileComplete, getParticipantStatus, getParticipantMomentum } from '../../shared/participantStatus.ts';

// Program Outcomes Reporting (Phase 7). Unlike getOrgDashboard (which
// covers only currently-ACTIVE participants for day-to-day coaching), this
// function covers EVERY participant ever linked to the org — active or
// revoked — since outcomes/grant reporting is a cumulative, historical
// question, not a snapshot of today's caseload.
//
// Every returned figure carries an explicit methodology note (also
// returned in the response) rather than presenting numbers as more
// precise or more verified than they are. In particular:
// - "profile completion" is the coarse presence-gate, not the weighted
//   Employment Intelligence Engine score (see participantStatus.ts).
// - Employment outcomes are entirely participant self-reported — there is
//   no employer verification anywhere in this product.
// - "Activity since enrollment" counts real recorded actions (profile
//   sections completed, resumes generated, applications submitted, logins)
//   from each participant's enrollment date onward. This is a count of
//   ACTIONS, not a precision "before/after" score — someone re-saving the
//   same section multiple times counts multiple times. Deliberately
//   labeled as activity, not as "readiness improvement," so it isn't
//   implied to be more precise than it is. No new tracking was added for
//   this — it reuses the ParticipantActivityEvent log already recorded
//   for the dashboard's momentum calculation.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { svc, organizationId } = await resolveOrgContext(base44);

    // ALL links ever, active or revoked — the enrollment history.
    const allLinks = await svc.entities.ParticipantOrgLink.filter(
      { organization_id: organizationId },
      'linked_at',
      1000
    );

    const participantIds = [...new Set(allLinks.map((l) => l.participant_id))];
    const linkByParticipant = new Map();
    for (const l of allLinks) {
      // Use the earliest enrollment for days-to-first-application.
      const existing = linkByParticipant.get(l.participant_id);
      if (!existing || new Date(l.linked_at) < new Date(existing.linked_at)) {
        linkByParticipant.set(l.participant_id, l);
      }
    }

    const employmentOutcomes = await svc.entities.EmploymentOutcome.filter(
      { organization_id: organizationId, status: "Active" },
      "-employment_start_date",
      1000
    );

    if (participantIds.length === 0) {
      const empty = emptyReport(organizationId);
      empty.total_hires = employmentOutcomes.length;
      empty.offer_accepted_count = employmentOutcomes.length;
      empty.hires_through_org_opportunities = employmentOutcomes.filter((o) => o.through_organization_opportunity).length;
      return Response.json(empty);
    }

    let profilesCompletedCount = 0;
    let resumesGeneratedCount = 0;
    let applicationsSubmittedCount = 0;
    let readyToApplyCount = 0;
    const offerAcceptedCount = employmentOutcomes.length;
    const hiresThroughOrgOpportunities = employmentOutcomes.filter(
      (o) => o.through_organization_opportunity
    ).length;
    const outcomesBySource = {
      "Job Seeker Reported": employmentOutcomes.filter((o) => o.source === "Job Seeker Reported").length,
      "Staff Verified": employmentOutcomes.filter((o) => o.source === "Staff Verified").length,
      "Employer Confirmed": employmentOutcomes.filter((o) => o.source === "Employer Confirmed").length,
    };
    const daysToFirstApplication = [];
    const activitySinceEnrollmentCounts = [];
    const careerInterestCounts = {};
    const industryInterestCounts = {};

    for (const participantId of participantIds) {
      const [profiles, employment, skills, activityEvents, applications, jobPrefs] = await Promise.all([
        svc.entities.UserProfile.filter({ created_by_id: participantId }, '-created_date', 1),
        svc.entities.EmploymentRecord.filter({ created_by_id: participantId }, '-created_date', 50),
        svc.entities.Skill.filter({ created_by_id: participantId }, '-created_date', 50),
        svc.entities.ParticipantActivityEvent.filter({ participant_id: participantId }, 'timestamp', 1000),
        svc.entities.Application.filter(
          { created_by_id: participantId, status: 'Submitted' },
          'application_submitted_date',
          200
        ),
        svc.entities.JobPreference.filter({ created_by_id: participantId }, '-created_date', 1),
      ]);

      const profile = profiles[0] || null;
      const isComplete = isCoreProfileComplete({ profile, employment, skills });
      if (isComplete) profilesCompletedCount++;

      // Current classification (uses only recent activity, matching
      // getOrgDashboard's own window) — for the "currently Ready to Apply"
      // snapshot count within this cumulative report.
      const recentEvents = activityEvents.filter((e) => {
        const t = new Date(e.timestamp).getTime();
        return Number.isFinite(t) && Date.now() - t <= 14 * 24 * 60 * 60 * 1000;
      });
      const status = getParticipantStatus(isComplete, recentEvents, profile?.employment_status);
      if (status === 'Ready to Apply') readyToApplyCount++;

      resumesGeneratedCount += activityEvents.filter((e) => e.event_type === 'resume_generated').length;
      applicationsSubmittedCount += applications.length;

      const enrollmentLink = linkByParticipant.get(participantId);
      if (enrollmentLink?.linked_at && applications.length > 0) {
        const firstAppDate = applications
          .map((a) => new Date(a.application_submitted_date).getTime())
          .filter(Number.isFinite)
          .sort((a, b) => a - b)[0];
        const linkedAt = new Date(enrollmentLink.linked_at).getTime();
        if (Number.isFinite(firstAppDate) && Number.isFinite(linkedAt) && firstAppDate >= linkedAt) {
          daysToFirstApplication.push((firstAppDate - linkedAt) / (1000 * 60 * 60 * 24));
        }
      }

      // Activity since enrollment: count of real recorded actions from
      // linked_at onward. Zero is a meaningful, included value here (unlike
      // days-to-first-application above) — someone who's done nothing since
      // joining is real, useful information for the average, not a data gap
      // to exclude.
      if (enrollmentLink?.linked_at) {
        const linkedAt = new Date(enrollmentLink.linked_at).getTime();
        const countSinceEnrollment = activityEvents.filter((e) => {
          const t = new Date(e.timestamp).getTime();
          return Number.isFinite(t) && Number.isFinite(linkedAt) && t >= linkedAt;
        }).length;
        activitySinceEnrollmentCounts.push(countSinceEnrollment);
      }

      const prefs = jobPrefs[0];
      (prefs?.desired_job_titles || []).forEach((t) => {
        careerInterestCounts[t] = (careerInterestCounts[t] || 0) + 1;
      });
      (prefs?.desired_industries || []).forEach((i) => {
        industryInterestCounts[i] = (industryInterestCounts[i] || 0) + 1;
      });
    }

    const topEntries = (counts, n = 5) =>
      Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([label, count]) => ({ label, count }));

    const avgDaysToFirstApplication =
      daysToFirstApplication.length > 0
        ? Math.round((daysToFirstApplication.reduce((a, b) => a + b, 0) / daysToFirstApplication.length) * 10) / 10
        : null;

    const avgActivitySinceEnrollment =
      activitySinceEnrollmentCounts.length > 0
        ? Math.round(
            (activitySinceEnrollmentCounts.reduce((a, b) => a + b, 0) / activitySinceEnrollmentCounts.length) * 10
          ) / 10
        : null;

    return Response.json({
      organization_id: organizationId,
      participants_enrolled: participantIds.length,
      profiles_completed: profilesCompletedCount,
      resumes_generated: resumesGeneratedCount,
      applications_submitted: applicationsSubmittedCount,
      currently_ready_to_apply: readyToApplyCount,
      average_days_to_first_application: avgDaysToFirstApplication,
      offer_accepted_count: offerAcceptedCount,
      total_hires: offerAcceptedCount,
      hires_through_org_opportunities: hiresThroughOrgOpportunities,
      outcomes_by_source: outcomesBySource,
      average_activity_since_enrollment: avgActivitySinceEnrollment,
      activity_since_enrollment_note:
        'Counts real actions recorded since each participant enrolled (profile sections completed, resumes generated, applications submitted, logins) — an activity count, not a precision before/after readiness score.',
      most_common_occupations: topEntries(careerInterestCounts),
      most_common_industries: topEntries(industryInterestCounts),
      methodology: {
        profile_completion:
          'Reflects presence of core profile sections (contact info, employment history, skills, professional summary) — not a weighted quality score.',
        employment_outcomes:
          'Hire counts come from EmploymentOutcome records attributed to this organization by employment start date. Sources are shown separately as Job Seeker Reported, Staff Verified, or Employer Confirmed.',
        general:
          'These figures represent aggregate program outcomes recorded in Apply Once. The source field distinguishes job-seeker reports, staff verification, and employer confirmation.',
      },
    });
  } catch (error) {
    return orgErrorResponse(error);
  }
}

function emptyReport(organizationId) {
  return {
    organization_id: organizationId,
    participants_enrolled: 0,
    profiles_completed: 0,
    resumes_generated: 0,
    applications_submitted: 0,
    currently_ready_to_apply: 0,
    average_days_to_first_application: null,
    offer_accepted_count: 0,
    total_hires: 0,
    hires_through_org_opportunities: 0,
    outcomes_by_source: {
      "Job Seeker Reported": 0,
      "Staff Verified": 0,
      "Employer Confirmed": 0,
    },
    average_activity_since_enrollment: null,
    activity_since_enrollment_note:
      'Counts real actions recorded since each participant enrolled (profile sections completed, resumes generated, applications submitted, logins) — an activity count, not a precision before/after readiness score.',
    most_common_occupations: [],
    most_common_industries: [],
    methodology: {
      profile_completion:
        'Reflects presence of core profile sections (contact info, employment history, skills, professional summary) — not a weighted quality score.',
      employment_outcomes:
        'Hire counts come from EmploymentOutcome records attributed to this organization by employment start date. Sources are shown separately as Job Seeker Reported, Staff Verified, or Employer Confirmed.',
      general:
        'These figures represent aggregate program outcomes recorded in Apply Once. The source field distinguishes job-seeker reports, staff verification, and employer confirmation.',
    },
  };
}