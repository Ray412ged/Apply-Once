import { isGuest, saveGuestSingle } from "@/lib/guestStorage";
import { base44 } from "@/api/base44Client";

// The profile entry method records how the user chose to begin building their
// employment profile: by uploading a resume ("resume_import") or by entering
// information manually ("manual"). Once set to "manual", resume-upload prompts
// are hidden throughout the manual profile flow so the chosen path is respected.

export function getProfileEntryMethodFromCompletion(completion) {
  return completion?.profile?.profile_entry_method || null;
}

// Persists the entry method. For guests, writes to sessionStorage; for
// authenticated users, updates the UserProfile entity. Non-blocking — a
// failure never interrupts the user's workflow.
export async function setProfileEntryMethod(method) {
  if (isGuest()) {
    saveGuestSingle("UserProfile", { profile_entry_method: method });
    return;
  }
  try {
    const profiles = await base44.entities.UserProfile.filter({}, "-created_date", 1);
    if (profiles.length > 0) {
      await base44.entities.UserProfile.update(profiles[0].id, { profile_entry_method: method });
    }
  } catch (err) {
    // Non-critical — the UI gates on the prop, which refreshes on next profile load.
  }
}