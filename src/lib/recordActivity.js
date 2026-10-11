import { base44 } from "@/api/base44Client";

/**
 * Fire-and-forget activity recording for the Organizational Dashboard's
 * momentum/status calculations. Never blocks or throws into the caller —
 * this is a background signal, not something that should ever interrupt
 * the actual user action it's attached to.
 *
 * @param {"login"|"profile_section_completed"|"resume_generated"|"application_submitted"} eventType
 */
export function recordActivity(eventType) {
  base44.functions
    .invoke("recordParticipantActivity", { event_type: eventType })
    .catch((err) => {
      // Non-critical background signal — log only, never surface to the user.
      console.warn(`Activity recording failed for "${eventType}":`, err?.message || err);
    });
}

const LOGIN_RECORDED_KEY = "apply_once_login_recorded_this_session";

/**
 * Records a single "login" activity event once per browser session,
 * regardless of login method (email/password, Google OAuth redirect-back,
 * etc.) — call this from wherever authentication is CONFIRMED (e.g.
 * AuthContext's checkUserAuth), not from a specific login form, so every
 * auth path is covered by one mechanism instead of one per method.
 *
 * Guarded by a sessionStorage flag (prefixed "apply_once_" so it is swept by
 * session cleanup on logout) so a page refresh for an
 * already-logged-in user doesn't re-fire "login" on every load, while a
 * fresh login after logout correctly fires again.
 */
export function recordLoginOnceThisSession() {
  try {
    if (sessionStorage.getItem(LOGIN_RECORDED_KEY)) return;
    sessionStorage.setItem(LOGIN_RECORDED_KEY, "1");
  } catch {
    // sessionStorage unavailable — fall through and record anyway rather
    // than silently never recording logins on this device.
  }
  recordActivity("login");
}