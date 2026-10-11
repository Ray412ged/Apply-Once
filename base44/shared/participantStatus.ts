/**
 * Participant status & momentum classification — BACKEND COPY.
 *
 * Deno backend functions cannot import from src/lib/ (that tree uses the
 * Vite "@/" alias, which does not resolve in the function runtime — every
 * existing backend function that shares code does so via base44/shared/,
 * never src/). This file mirrors src/lib/participantStatus.js's
 * classification math exactly. It intentionally does NOT duplicate the
 * Employment Intelligence Engine's scoring/breakdown logic — only the same
 * minimal "is the profile complete enough" boolean gate the frontend
 * engine already exposes as applicationReadiness.applicationReady, computed
 * here from the same four required sections (contact, employment, skills,
 * summary) the engine itself gates on.
 *
 * If either the thresholds or the required-sections list change, update
 * BOTH this file and src/lib/participantStatus.js / readiness/engine.js.
 */

export const NEEDS_ENCOURAGEMENT_INACTIVITY_DAYS = 3;
export const RECENT_ENGAGEMENT_WINDOW_DAYS = NEEDS_ENCOURAGEMENT_INACTIVITY_DAYS;
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

function mostRecentEventDaysAgo(activityEvents) {
  if (!activityEvents || activityEvents.length === 0) return Infinity;
  const mostRecent = activityEvents.reduce((latest, e) => {
    const t = new Date(e.timestamp).getTime();
    return Number.isFinite(t) && t > latest ? t : latest;
  }, 0);
  if (!mostRecent) return Infinity;
  return (Date.now() - mostRecent) / (1000 * 60 * 60 * 24);
}

/** Minimal presence gate mirroring engine.js's REQUIRED_SECTIONS check —
 * NOT a scoring recomputation, just "are the same four sections present". */
export function isCoreProfileComplete({ profile, employment, skills }) {
  const hasContact = !!(profile?.first_name && profile?.last_name && (profile?.email || profile?.phone));
  const hasEmployment = !!(employment && employment.length > 0);
  const hasSkills = !!(skills && skills.length > 0);
  const hasSummary = !!(profile?.professional_summary && profile.professional_summary.trim().length > 0);
  return hasContact && hasEmployment && hasSkills && hasSummary;
}

export function getParticipantStatus(isComplete, activityEvents = [], employmentStatus) {
  if (employmentStatus === "Offer Accepted") return STATUS.EMPLOYED;

  const inactivityDays = mostRecentEventDaysAgo(activityEvents);

  if (!isComplete) {
    if (inactivityDays >= NEEDS_ENCOURAGEMENT_INACTIVITY_DAYS) return STATUS.NEEDS_ENCOURAGEMENT;
    return STATUS.BUILDING_PROFILE;
  }
  if (inactivityDays <= RECENT_ENGAGEMENT_WINDOW_DAYS) return STATUS.READY_TO_APPLY;
  return STATUS.NEEDS_ENCOURAGEMENT;
}

export function getParticipantMomentum(activityEvents = []) {
  const now = Date.now();
  const windowMs = MOMENTUM_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const halfWindowMs = windowMs / 2;

  let recentHalfCount = 0;
  let priorHalfCount = 0;

  for (const e of activityEvents || []) {
    const t = new Date(e.timestamp).getTime();
    if (!Number.isFinite(t)) continue;
    const age = now - t;
    if (age < 0 || age > windowMs) continue;
    if (age <= halfWindowMs) recentHalfCount++;
    else priorHalfCount++;
  }

  if (recentHalfCount === 0 && priorHalfCount === 0) return MOMENTUM.SLOWING;
  if (recentHalfCount > priorHalfCount) return MOMENTUM.BUILDING;
  if (recentHalfCount === 0 || recentHalfCount < priorHalfCount) return MOMENTUM.SLOWING;
  return MOMENTUM.MAINTAINING;
}