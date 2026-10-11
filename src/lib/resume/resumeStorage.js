/**
 * Resume status + celebration persistence.
 *
 * "Updated" detection compares a stable resume signature (from
 * resumeGenerator) to the last one seen when the user viewed the resume.
 *
 * Storage policy (spec):
 *   - Authenticated users → persisted across sessions (localStorage).
 *   - Guests              → session-only (sessionStorage).
 *
 * No duplicate resume-content record is stored — only a short signature
 * and two boolean flags.
 */

import { base44 } from "@/api/base44Client";

const CELEBRATION_KEY = "aor_resume_celebrated";
const SIGNATURE_KEY = "aor_resume_signature";

function scopeKey(base, user, guest) {
  return guest ? `${base}_guest` : `${base}_${user?.id || "anon"}`;
}

function read(scope, isGuest) {
  try {
    return isGuest
      ? sessionStorage.getItem(scope)
      : localStorage.getItem(scope);
  } catch {
    return null;
  }
}

function write(scope, isGuest, value) {
  try {
    if (isGuest) sessionStorage.setItem(scope, value);
    else localStorage.setItem(scope, value);
  } catch {
    // storage unavailable or full — non-fatal
  }
}

/** "not_ready" | "ready" | "updated"
 *  For authenticated users, a server-persisted signature (UserProfile
 *  last_resume_signature) is used as a cross-device fallback when no
 *  local signature exists on this device. Local storage remains the
 *  primary reference on the device where the resume was last viewed. */
export function getResumeStatus(resume, user, guest, serverSignature = null) {
  if (!resume || !resume.canGenerate) return "not_ready";
  const localStored = read(scopeKey(SIGNATURE_KEY, user, guest), guest);
  const reference = localStored || (!guest ? serverSignature : null);
  if (reference && reference !== resume.signature) return "updated";
  return "ready";
}

/** Call when the user opens the resume preview so the signature resets
 *  to "ready" until the next profile change. For authenticated users,
 *  the signature is also persisted to UserProfile.last_resume_signature
 *  so the "Updated" state syncs across devices. Pass the profile id so
 *  the server record can be updated without an extra fetch. */
export async function markResumeViewed(resume, opts = {}) {
  if (!resume || !resume.signature) return;
  const { user, guest = false, profileId = null } = opts;
  write(scopeKey(SIGNATURE_KEY, user, guest), guest, resume.signature);
  if (!guest && profileId) {
    try {
      await base44.entities.UserProfile.update(profileId, {
        last_resume_signature: resume.signature,
      });
    } catch (err) {
      console.error("Failed to sync resume signature:", err);
    }
  }
}

export function hasResumeCelebrationBeenShown(user, guest) {
  return read(scopeKey(CELEBRATION_KEY, user, guest), guest) === "true";
}

export function markResumeCelebrationShown(user, guest) {
  write(scopeKey(CELEBRATION_KEY, user, guest), guest, "true");
}