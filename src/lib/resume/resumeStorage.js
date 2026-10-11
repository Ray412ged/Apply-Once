/**
 * Resume status + celebration persistence for authenticated users.
 *
 * "Updated" detection compares a stable resume signature (from
 * resumeGenerator) to the last one seen when the user viewed the resume.
 */

import { base44 } from "@/api/base44Client";

const CELEBRATION_KEY = "aor_resume_celebrated";
const SIGNATURE_KEY = "aor_resume_signature";

function scopeKey(base, user) {
  return `${base}_${user?.id || "account"}`;
}

function read(scope) {
  try {
    return localStorage.getItem(scope);
  } catch {
    return null;
  }
}

function write(scope, value) {
  try {
    localStorage.setItem(scope, value);
  } catch {
    // storage unavailable or full — non-fatal
  }
}

export function getResumeStatus(resume, user, serverSignature = null) {
  if (!resume || !resume.canGenerate) return "not_ready";
  const localStored = read(scopeKey(SIGNATURE_KEY, user));
  const reference = localStored || serverSignature;
  if (reference && reference !== resume.signature) return "updated";
  return "ready";
}

export async function markResumeViewed(resume, opts = {}) {
  if (!resume || !resume.signature) return;
  const { user, profileId = null } = opts;
  write(scopeKey(SIGNATURE_KEY, user), resume.signature);
  if (profileId) {
    try {
      await base44.entities.UserProfile.update(profileId, {
        last_resume_signature: resume.signature,
      });
    } catch (err) {
      console.error("Failed to sync resume signature:", err);
    }
  }
}

export function hasResumeCelebrationBeenShown(user) {
  return read(scopeKey(CELEBRATION_KEY, user)) === "true";
}

export function markResumeCelebrationShown(user) {
  write(scopeKey(CELEBRATION_KEY, user), "true");
}