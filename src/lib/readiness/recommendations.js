/**
 * Recommendations — prioritized action list for improving readiness.
 *
 * Each recommendation includes:
 *   { id, title, priority, impact, estimatedTime, reason, route }
 *
 * Recommendations are always ordered by impact (highest first).
 * The engine never generates recommendations independently — it
 * always delegates to this module.
 */

import { getRecommendationPriority, SCORE_STATUS } from "./constants";

const RECOMMENDATION_META = {
  contact:     { route: "/profile/edit?section=about",         estimatedTime: "2 minutes",  reason: "Employers need a way to reach you. Completing your contact information ensures you don't miss opportunities." },
  summary:     { route: "/profile/edit?section=introduction",  estimatedTime: "5 minutes",  reason: "A professional summary gives employers a quick snapshot of your value before they read your full history." },
  employment:  { route: "/profile/edit?section=employment",    estimatedTime: "10 minutes", reason: "Your work history is the foundation of every application. Adding it unlocks job matching and readiness scoring." },
  skills:      { route: "/profile/edit?section=skills",         estimatedTime: "5 minutes",  reason: "Skills drive job matching. The more you add, the more relevant jobs we can surface — including transferable skills from your work history." },
  profile:     { route: "/profile/edit",                        estimatedTime: "15 minutes", reason: "A complete profile signals professionalism and readiness to employers." },
};

const FALLBACK_META = {
  route: "/profile",
  estimatedTime: "5 minutes",
  reason: "Improving this will increase your overall readiness.",
};

/**
 * Generates prioritized recommendations ordered by highest impact first.
 *
 * @param {EmploymentProfileSnapshot} snapshot
 * @param {object} ctx — { weights, breakdown } from the engine's readiness calculation
 * @returns {Recommendation[]}
 */
export function generateRecommendations(snapshot, ctx = {}) {
  if (!snapshot) return [];

  const { breakdown = {} } = ctx;
  const recs = [];

  for (const [key, entry] of Object.entries(breakdown)) {
    if (entry.status === SCORE_STATUS.STRONG) continue;

    const gap = 100 - entry.score;
    if (gap === 0) continue;

    const impact = Math.round(gap * entry.weight);
    if (impact === 0) continue;

    const meta = RECOMMENDATION_META[key] || FALLBACK_META;
    const priority = getRecommendationPriority(impact);

    recs.push({
      id: key,
      title: entry.label,
      priority,
      impact,
      estimatedTime: meta.estimatedTime,
      reason: meta.reason,
      route: meta.route,
      // Backward-compatible fields
      expectedIncrease: impact,
      actionLabel: entry.label,
      actionUrl: meta.route,
      currentScore: entry.score,
      maxIncrease: Math.round(100 * entry.weight),
    });
  }

  recs.sort((a, b) => b.impact - a.impact);
  return recs;
}