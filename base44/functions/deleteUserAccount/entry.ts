import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Full account deletion. Replaces the previous direct client-side
// User.delete() call (which a normal user very likely cannot perform at
// all, and whose failure was previously swallowed silently, leaving the
// User record intact while the app told the user deletion had succeeded).
//
// This function runs the entire deletion under service role — the ONLY
// place in this codebase with elevated privilege for this operation — and
// the client only ever receives a success/failure result, never any
// service-role credential or capability itself.
//
// SAFETY-CRITICAL: every deleteMany call below is explicitly scoped to the
// calling user's own id. Unlike a normal client call (where RLS implicitly
// scopes an empty-filter deleteMany to the caller's own rows), service
// role BYPASSES RLS entirely — an unscoped deleteMany here would delete
// every user's data for that entity across the whole app. Do not remove
// the ownership filter from any of these calls.
//
// Deliberately excludes ApplicationStep: confirmed (see audit) to be
// shared, admin-managed employer-level reference data with no user-linking
// field at all (keyed only by employer_intelligence_id) — it is not this
// user's data and must never be touched by account deletion.
const CREATED_BY_ENTITIES = [
  'UserProfile',
  'JobPreference',
  'EmploymentRecord',
  'EducationRecord',
  'Skill',
  'Credential',
  'Reference',
  'UserDocument',
  'ReusableAnswer',
  'JobMatch',
  'Application',
  'HiddenJob',
  'JobSwipeAction',
  'SavedJob',
];

const PARTICIPANT_ID_ENTITIES = [
  'ParticipantActivityEvent',
  'ParticipantOrgLink',
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = user.id;
    const svc = base44.asServiceRole;

    const entityResults = {};

    // Delete all created_by_id-owned records, explicitly scoped.
    for (const entityName of CREATED_BY_ENTITIES) {
      try {
        const result = await svc.entities[entityName].deleteMany({ created_by_id: userId });
        entityResults[entityName] = { deleted: true, detail: result ?? null };
      } catch (err) {
        entityResults[entityName] = { deleted: false, error: err.message };
      }
    }

    // Delete all participant_id-owned records, explicitly scoped.
    for (const entityName of PARTICIPANT_ID_ENTITIES) {
      try {
        const result = await svc.entities[entityName].deleteMany({ participant_id: userId });
        entityResults[entityName] = { deleted: true, detail: result ?? null };
      } catch (err) {
        entityResults[entityName] = { deleted: false, error: err.message };
      }
    }

    const anyEntityDeletionFailed = Object.values(entityResults).some((r) => !r.deleted);

    // Delete the User record itself, then VERIFY it is actually gone rather
    // than trusting a non-throwing delete() call. This is the specific
    // failure mode from the audit: the previous code assumed success
    // whenever no error was thrown.
    let userDeleted = false;
    let userDeletionError = null;
    try {
      await svc.entities.User.delete(userId);
      // Verify: attempting to fetch the just-deleted user should fail or
      // return nothing. If it still returns a record, deletion did not
      // actually take effect and must NOT be reported as successful.
      try {
        const stillExists = await svc.entities.User.get(userId);
        userDeleted = !stillExists;
      } catch {
        // get() throwing (e.g. not found) is the expected, confirming outcome.
        userDeleted = true;
      }
    } catch (err) {
      userDeletionError = err.message;
      userDeleted = false;
    }

    const success = userDeleted && !anyEntityDeletionFailed;

    return Response.json({
      success,
      user_deleted: userDeleted,
      user_deletion_error: userDeletionError,
      entities: entityResults,
      error: success
        ? null
        : userDeleted
        ? 'Account was deleted but some associated data may not have been fully removed.'
        : 'Account deletion could not be completed. Your data has not been removed and your account remains active.',
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}