/**
 * Post-Engagement Follow-Up Check-In (Phase 6)
 * ============================================================
 * Determines whether the ONE consented, minimal follow-up prompt should
 * show for a participant who has left an organization. Deliberately not
 * a new question or a new form — it reuses EmploymentStatusCard's exact
 * existing two states ("Still searching" / "I found a job!"). This module
 * only decides IF the prompt is due, never what it says.
 */

// Fixed window between when a relationship ends (revoked_at) and when the
// one-time check-in becomes eligible to show. Named constant, matching the
// pattern used for the other thresholds in this feature.
export const FOLLOWUP_CHECKIN_DAYS = 90;

/**
 * @param {object} link - a ParticipantOrgLink record (revoked).
 * @param {string} [employmentStatus] - the participant's current
 *   UserProfile.employment_status. If they've already confirmed
 *   employment on their own via the standing Home card, there's nothing
 *   to ask — the answer is already known.
 * @returns {boolean}
 */
export function isFollowupCheckinDue(link, employmentStatus) {
  if (!link) return false;
  if (link.status !== "revoked") return false;
  if (!link.post_engagement_followup_consent) return false;
  if (link.followup_checkin_answered) return false;
  if (employmentStatus === "Offer Accepted") return false; // already known, nothing to ask
  if (!link.revoked_at) return false;

  const revokedAt = new Date(link.revoked_at).getTime();
  if (!Number.isFinite(revokedAt)) return false;

  const daysSinceRevoked = (Date.now() - revokedAt) / (1000 * 60 * 60 * 24);
  return daysSinceRevoked >= FOLLOWUP_CHECKIN_DAYS;
}

/**
 * Finds the (at most one, given the single-active-link invariant elsewhere
 * in this feature) most relevant revoked link a follow-up prompt is due
 * for, out of a participant's full link history.
 *
 * @param {Array} links - all of the participant's own ParticipantOrgLink rows.
 * @param {string} [employmentStatus]
 * @returns {object|null}
 */
export function findDueFollowupLink(links, employmentStatus) {
  if (!links || links.length === 0) return null;
  return links.find((l) => isFollowupCheckinDue(l, employmentStatus)) || null;
}