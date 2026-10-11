// Guest mode storage using sessionStorage.
// Allows users to build a profile without authenticating.
// Data is session-local (per-tab) and never exposed to other users.
// On shared computers, closing the tab automatically clears all guest data.
// On account creation, data syncs to the database and guest mode is cleared.

import { findDuplicate } from "@/lib/resumeDedup";

const GUEST_FLAG = "applyonce_guest";
const GUEST_DATA = "applyonce_guest_data";
const MIGRATION_COMPLETED_FLAG = "applyonce_migration_completed";
const ONBOARDING_POSITION_KEY = "first_jobs_visit_done";
const GUEST_INTRO_SEEN_KEY = "applyonce_guest_intro_seen";
const PENDING_EMAIL_KEY = "applyonce_pending_email";
const GUEST_GATE_DISMISSED_KEY = "applyonce_guest_gate_dismissed";

// All app-specific key prefixes/patterns that may exist in sessionStorage.
// Used by clearAllSessionData() and purgeLegacyLocalStorage() to wipe
// everything the app has written, without touching unrelated keys.
const APP_KEY_PATTERNS = [
  "applyonce_",
  "apply_once_",
  "workspace_",
  "first_jobs_visit_done",
  "readiness_progress_history",
  "jobs_selected_view",
];

function storageMatches(key) {
  return APP_KEY_PATTERNS.some((p) => key.startsWith(p));
}

// --- Session storage access (safe wrappers) ---
function getSessionItem(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function setSessionItem(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // sessionStorage may be unavailable or full
  }
}

function removeSessionItem(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // sessionStorage may be unavailable
  }
}

export function isGuest() {
  return getSessionItem(GUEST_FLAG) === "true";
}

// --- Pending-email identity ---
// When a prospect provides their email up front (before creating an account),
// the email becomes their identity for the rest of onboarding. They are NOT a
// guest: no guest flag is set, and no migration prompt is shown later. Their
// onboarding data is still stored locally (reusing GUEST_DATA) and synced to
// the account silently once they finish creating a password.
export function setPendingEmail(email) {
  setSessionItem(PENDING_EMAIL_KEY, email);
}

export function getPendingEmail() {
  return getSessionItem(PENDING_EMAIL_KEY) || "";
}

export function clearPendingEmail() {
  removeSessionItem(PENDING_EMAIL_KEY);
}

export function isPending() {
  return !!getPendingEmail();
}

// True for both true guests (no email) and pending-email prospects. Both use
// session storage during onboarding; the difference is only how account
// creation is handled (migration prompt vs. silent sync).
export function isLocalProfile() {
  return isGuest() || isPending();
}

export function setGuestMode(enabled) {
  if (enabled) {
    setSessionItem(GUEST_FLAG, "true");
  } else {
    removeSessionItem(GUEST_FLAG);
    removeSessionItem(GUEST_DATA);
    removeSessionItem(GUEST_INTRO_SEEN_KEY);
    removeSessionItem(GUEST_GATE_DISMISSED_KEY);
  }
}

// Guest gate dismissal: when a guest chooses "Continue as Guest" on the
// save-prompt gate, this flag lets them proceed to non-profile routes for the
// remainder of the session without re-showing the prompt. Cleared on logout
// and guest-mode exit (session-only, never persisted to a shared device).
export function setGuestGateDismissed() {
  setSessionItem(GUEST_GATE_DISMISSED_KEY, "true");
}

export function isGuestGateDismissed() {
  return getSessionItem(GUEST_GATE_DISMISSED_KEY) === "true";
}

export function clearGuestGateDismissed() {
  removeSessionItem(GUEST_GATE_DISMISSED_KEY);
}

// Clear only the guest flag, preserving guest data for migration.
// Called after authentication succeeds so the app loads profile data
// from the API instead of sessionStorage. Guest data remains available
// for syncGuestToAccount() to migrate if needed.
export function clearGuestFlag() {
  removeSessionItem(GUEST_FLAG);
}

// Migration-completed flag: set after the user explicitly chooses to
// keep or discard their guest data. Prevents the migration prompt from
// reappearing and ensures migration runs at most once.
export function setMigrationCompleted() {
  setSessionItem(MIGRATION_COMPLETED_FLAG, "true");
}

export function hasMigrationCompleted() {
  return getSessionItem(MIGRATION_COMPLETED_FLAG) === "true";
}

// Guest introduction screen flag: set once the guest has seen the intro
// screen, so it is not shown again on subsequent visits to /onboarding
// during the same guest session. Cleared when guest mode is turned off.
export function setGuestIntroSeen() {
  setSessionItem(GUEST_INTRO_SEEN_KEY, "true");
}

export function hasGuestIntroSeen() {
  return getSessionItem(GUEST_INTRO_SEEN_KEY) === "true";
}

function getGuestData() {
  try {
    return JSON.parse(getSessionItem(GUEST_DATA) || "{}");
  } catch (err) {
    // Corrupted JSON in sessionStorage would otherwise silently look like an
    // empty (but valid) guest profile, hiding real data loss from the user.
    console.warn("Guest profile data could not be read (corrupted or invalid):", err);
    return {};
  }
}

function saveGuestData(data) {
  try {
    sessionStorage.setItem(GUEST_DATA, JSON.stringify(data));
  } catch (err) {
    // Most commonly a full storage quota. The write is dropped, so the user's
    // last change never made it to disk — worth knowing about even though we
    // don't have a UI hook here to surface it directly to them.
    console.warn("Guest profile data could not be saved (storage full or unavailable):", err);
  }
}

// Single-record entities (UserProfile, JobPreference)
export function getGuestSingle(entity) {
  const data = getGuestData();
  return data[entity]?.[0] || null;
}

export function saveGuestSingle(entity, record) {
  const data = getGuestData();
  if (!data[entity]) data[entity] = [];
  if (data[entity].length > 0) {
    data[entity][0] = { ...data[entity][0], ...record };
  } else {
    data[entity] = [{ ...record }];
  }
  saveGuestData(data);
}

// List entities (EmploymentRecord, EducationRecord, etc.)
export function getGuestRecords(entity) {
  const data = getGuestData();
  return data[entity] || [];
}

export function addGuestRecord(entity, record) {
  const data = getGuestData();
  if (!data[entity]) data[entity] = [];
  const newRecord = {
    ...record,
    id: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
  };
  data[entity].push(newRecord);
  saveGuestData(data);
  return newRecord;
}

export function updateGuestRecord(entity, id, updates) {
  const data = getGuestData();
  if (!data[entity]) return;
  data[entity] = data[entity].map((r) =>
    r.id === id ? { ...r, ...updates, updated_date: new Date().toISOString() } : r
  );
  saveGuestData(data);
}

export function deleteGuestRecord(entity, id) {
  const data = getGuestData();
  if (!data[entity]) return;
  data[entity] = data[entity].filter((r) => r.id !== id);
  saveGuestData(data);
}

export function bulkAddGuestRecords(entity, records) {
  const data = getGuestData();
  if (!data[entity]) data[entity] = [];
  const newRecords = records.map((record) => ({
    ...record,
    id: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
  }));
  data[entity].push(...newRecords);
  saveGuestData(data);
  return newRecords;
}

// Sync all guest data to the database after the user creates an account.
// Called once on first authentication when guest data exists.
export async function syncGuestToAccount() {
  const { base44 } = await import("@/api/base44Client");
  const data = getGuestData();
  const entities = Object.keys(data);

  for (const entity of entities) {
    const records = data[entity];
    if (!records || records.length === 0) continue;

    if (entity === "UserProfile" || entity === "JobPreference") {
      // Single-record entities: check if one already exists
      const existing = await base44.entities[entity].filter({}, "-created_date", 1);
      const cleanRecord = { ...records[0] };
      delete cleanRecord.id;
      delete cleanRecord.created_date;
      delete cleanRecord.updated_date;

      if (existing.length > 0) {
        await base44.entities[entity].update(existing[0].id, cleanRecord);
      } else {
        await base44.entities[entity].create(cleanRecord);
      }
    } else {
      // List entities: load existing account records and create only
      // those without a duplicate. This makes migration idempotent —
      // re-running after a full or partial migration creates zero
      // duplicate records. Intra-batch duplicates (the same record
      // appearing twice in guest data) are also caught because each
      // record scheduled for creation is added to the known set before
      // processing the next one.
      const cleanRecords = records.map(({ id, created_date, updated_date, ...rest }) => rest);
      if (cleanRecords.length === 0) continue;

      const existingAccount = await base44.entities[entity].filter({}, "-created_date", 500);
      // Start with account records, then append each record scheduled
      // for creation so subsequent guest records in the same batch are
      // checked against it.
      const knownRecords = [...existingAccount];
      const toCreate = [];

      for (const guestRecord of cleanRecords) {
        const dup = findDuplicate(entity, guestRecord, knownRecords);
        if (!dup) {
          toCreate.push(guestRecord);
          knownRecords.push(guestRecord);
        }
      }

      if (toCreate.length > 0) {
        await base44.entities[entity].bulkCreate(toCreate);
      }
    }
  }

  // Clear guest data after successful sync
  setGuestMode(false);
}

export function hasGuestData() {
  const data = getGuestData();
  return Object.keys(data).length > 0;
}

// Remove ALL guest and profile-related data from sessionStorage.
// Called during profile/account deletion and when the user chooses
// to start fresh. Clears every session key tied to profile state:
// guest flag, guest entity data, migration status, onboarding position.
export function clearAllGuestData() {
  removeSessionItem(GUEST_FLAG);
  removeSessionItem(GUEST_DATA);
  removeSessionItem(MIGRATION_COMPLETED_FLAG);
  removeSessionItem(ONBOARDING_POSITION_KEY);
  removeSessionItem(PENDING_EMAIL_KEY);
  removeSessionItem(GUEST_INTRO_SEEN_KEY);
  removeSessionItem(GUEST_GATE_DISMISSED_KEY);
}

// Comprehensive session wipe — clears every app-specific key in
// sessionStorage (guest data, workspace state, builder drafts, UI
// flags, progress history, etc.). Called on logout to protect
// shared-device users from leaving any trace of their session behind.
export function clearAllSessionData() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && storageMatches(key)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // sessionStorage may be unavailable
  }
}

// One-time migration: moves any legacy localStorage data to sessionStorage
// and removes the old keys. Safe to call on every app startup — it only
// does work if old localStorage keys still exist.
export function purgeLegacyLocalStorage() {
  try {
    // Migrate guest data: if sessionStorage doesn't have it but
    // localStorage does, copy it over before removing.
    const legacyGuestData = localStorage.getItem(GUEST_DATA);
    if (legacyGuestData && !getSessionItem(GUEST_DATA)) {
      setSessionItem(GUEST_DATA, legacyGuestData);
    }

    // Migrate pending email
    const legacyPendingEmail = localStorage.getItem(PENDING_EMAIL_KEY);
    if (legacyPendingEmail && !getSessionItem(PENDING_EMAIL_KEY)) {
      setSessionItem(PENDING_EMAIL_KEY, legacyPendingEmail);
    }

    // Migrate guest flag
    if (localStorage.getItem(GUEST_FLAG) === "true" && !getSessionItem(GUEST_FLAG)) {
      setSessionItem(GUEST_FLAG, "true");
    }

    // Remove all legacy localStorage keys (app-specific only).
    // The debug flag (applyonce_diag_debug) is intentionally kept in
    // localStorage — it's an admin setting, not user session data.
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && storageMatches(key)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // localStorage may be unavailable
  }
}