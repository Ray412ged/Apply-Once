/**
 * Pure presentation helpers for the Employment Command Center.
 *
 * These derive a UI-facing overall status and copy from the canonical
 * engine output. They contain NO readiness calculations — the engine
 * remains the single source of truth for scoring.
 */

export const REQUIRED_SECTIONS = ["contact", "employment", "skills", "summary"];

/**
 * Maps the engine's `applicationReady` flag + per-section statuses to one
 * of three UI states for the Command Center header.
 *
 *   "ready"    — applicationReady AND every required core section Complete
 *   "review"   — applicationReady but some core sections still In Progress
 *   "building" — not yet application ready
 */
export function deriveOverallState(applicationReady, sectionStatuses) {
  if (!applicationReady) return "building";
  const allComplete = REQUIRED_SECTIONS.every(
    (k) => sectionStatuses?.[k]?.status === "Complete"
  );
  return allComplete ? "ready" : "review";
}

/**
 * Returns a brief, encouraging explanation for an engine readiness status.
 * Never punitive — focused on preparation and next steps.
 */
export function getReadinessExplanation(status) {
  switch (status) {
    case "Application Ready":
      return "Your profile has the core information employers need to begin applying.";
    case "Almost Ready":
      return "You're close — one or two more core sections will get you fully ready.";
    case "Building Momentum":
      return "Good progress. Keep adding to your core sections.";
    case "Getting Started":
      return "Let's add your core information to get you ready to apply.";
    case "Not Started":
      return "Start with your contact information to begin your profile.";
    default:
      return "Keep building your profile to unlock more opportunities.";
  }
}

/**
 * Returns title + explanation copy for the three Command Center header states.
 */
export function getStateCopy(state) {
  switch (state) {
    case "ready":
      return {
        title: "Application Ready",
        explanation:
          "Your profile contains the core information needed to begin applying for jobs.",
      };
    case "review":
      return {
        title: "Ready to Review",
        explanation:
          "Your core profile is ready. Review your details or explore matching jobs.",
      };
    default:
      return {
        title: "Building Your Application Profile",
        explanation:
          "Complete a few more core sections to prepare your application profile.",
      };
  }
}