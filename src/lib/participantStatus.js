/**
 * Participant Status & Momentum
 * ============================================================
 * Organizational-dashboard-facing status categories and momentum,
 * computed from existing Employment Intelligence Engine output
 * (profileCompletion / applicationReadiness.applicationReady) plus
 * the ParticipantActivityEvent time series. This module contains
 * NO independent readiness or completion scoring — it only
 * classifies engine output + activity events into coach-facing
 * language. See src/lib/readiness/engine.js for the actual scoring.
 *
 * Thresholds are named constants so they're a one-line change if
 * the exact day counts need adjusting after real usage is observed.
 */

// Confirm before relying on this in production: current direction (most
// recent instruction) says 3 days; the submitted final phase-plan document
// says 7 days with a note that it should become configurable later. Using
// 3 here per the most recent explicit instruction — flagged for the
// reporting/output step so it can be corrected in one place if 7 is right.
export const NEEDS_ENCOURAGEMENT_INACTIVITY_DAYS = 3;

// Same window reused for "recent engagement" so the three status
// categories stay internally consistent rather than using a second,
// unrelated number.
export const RECENT_ENGAGEMENT_WINDOW_DAYS = NEEDS_ENCOURAGEMENT_INACTIVITY_DAYS;

// Rolling window for momentum, consistent with the existing "inactive
// 14+ days" organizational metric already scoped for the dashboard.
export const MOMENTUM_WINDOW_DAYS = 14;

export const STATUS = {
  BUILDING_PROFILE: "Building Profile",
  NEEDS_ENCOURAGEMENT: "Needs Encouragement",
  READY_TO_APPLY: "Ready to Apply",
  EMPLOYED: "Employed",
};

export const MOMENTUM = {
  BUILDING: "Building Momentum",
  MAINTAINING: "Maintaining Momentum",
  SLOWING: "Momentum Slowing",
};

function daysSince(timestamp) {
  if (!timestamp) return Infinity;
  const then = new Date(timestamp).getTime();
  if (Number.isNaN(then)) return Infinity;
  return (Date.now() - then) / (1000 * 60 * 60 * 24);
}

function mostRecentEventDaysAgo(activityEvents) {
  if (!activityEvents || activityEvents.length === 0) return Infinity;
  const mostRecent = activityEvents.reduce((latest, e) => {
    const t = new Date(e.timestamp).getTime();
    return Number.isFinite(t) && t > latest ? t : latest;
  }, 0);
  if (!mostRecent) return Infinity;
  return (Date.now() - mostRecent) / (1000 * 60 * 60 * 24);
}

/**
 * Classifies a participant into one of four status categories.
 *
 * @param {object} engineOutput - the object returned by runEngine() —
 *   only profileCompletion and applicationReadiness.applicationReady
 *   are used; nothing here recalculates completion/readiness.
 * @param {Array} activityEvents - ParticipantActivityEvent rows for
 *   this participant, most recent first or in any order.
 * @param {string} [employmentStatus] - UserProfile.employment_status
 *   ("Searching" or "Offer Accepted"). When "Offer Accepted", this
 *   short-circuits to STATUS.EMPLOYED regardless of profile completion
 *   or activity — an employed participant is no longer in the
 *   job-search pipeline this dashboard is meant to surface.
 * @returns {string} one of STATUS.*
 */
export function getParticipantStatus(engineOutput, activityEvents = [], employmentStatus) {
  if (employmentStatus === "Offer Accepted") {
    return STATUS.EMPLOYED;
  }

  const isComplete = !!engineOutput?.applicationReadiness?.applicationReady;
  const inactivityDays = mostRecentEventDaysAgo(activityEvents);

  if (!isComplete) {
    if (inactivityDays >= NEEDS_ENCOURAGEMENT_INACTIVITY_DAYS) {
      return STATUS.NEEDS_ENCOURAGEMENT;
    }
    return STATUS.BUILDING_PROFILE;
  }

  // Profile is complete. Recent engagement -> Ready to Apply; otherwise
  // still complete but quiet -> Needs Encouragement (a completed profile
  // that's gone cold is exactly the coaching moment this category exists
  // to surface, not a reason to hide the participant from that list).
  if (inactivityDays <= RECENT_ENGAGEMENT_WINDOW_DAYS) {
    return STATUS.READY_TO_APPLY;
  }
  return STATUS.NEEDS_ENCOURAGEMENT;
}

/**
 * Classifies momentum over a trailing window, independent of status.
 * A participant can be READY_TO_APPLY with SLOWING momentum at the same
 * time — these are deliberately separate signals, not one blended score.
 *
 * @param {Array} activityEvents - ParticipantActivityEvent rows.
 * @returns {string} one of MOMENTUM.*
 */
export function getParticipantMomentum(activityEvents = []) {
  const now = Date.now();
  const windowMs = MOMENTUM_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const halfWindowMs = windowMs / 2;

  let recentHalfCount = 0; // most recent half of the window
  let priorHalfCount = 0; // older half of the window

  for (const e of activityEvents || []) {
    const t = new Date(e.timestamp).getTime();
    if (!Number.isFinite(t)) continue;
    const age = now - t;
    if (age < 0 || age > windowMs) continue;
    if (age <= halfWindowMs) recentHalfCount++;
    else priorHalfCount++;
  }

  if (recentHalfCount === 0 && priorHalfCount === 0) {
    return MOMENTUM.SLOWING;
  }
  if (recentHalfCount > priorHalfCount) {
    return MOMENTUM.BUILDING;
  }
  if (recentHalfCount === 0 || recentHalfCount < priorHalfCount) {
    return MOMENTUM.SLOWING;
  }
  return MOMENTUM.MAINTAINING;
}

/**
 * Convenience: computes both status and momentum together from the same
 * activity events, so callers don't have to fetch/pass the list twice.
 */
export function getParticipantStatusAndMomentum(engineOutput, activityEvents = [], employmentStatus) {
  return {
    status: getParticipantStatus(engineOutput, activityEvents, employmentStatus),
    momentum: getParticipantMomentum(activityEvents),
    daysSinceLastActivity:
      mostRecentEventDaysAgo(activityEvents) === Infinity
        ? null
        : Math.round(mostRecentEventDaysAgo(activityEvents) * 10) / 10,
  };
}