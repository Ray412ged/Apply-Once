// Shared utilities for dismissed-job (pass) operations.
// JobSwipeAction with action "pass" is the single source of truth for
// dismissed jobs across both List and Discovery views.

import { base44 } from "@/api/base44Client";

// Get or create a JobSwipeAction with action "pass" for a given job posting.
// If an existing action exists (save/interested), it is updated to "pass".
// If one already is "pass", it is returned as-is (prevents duplicates).
export async function getOrCreatePassAction(jobPostingId) {
  const existing = await base44.entities.JobSwipeAction.filter(
    { job_posting_id: jobPostingId },
    "-created_date",
    1
  );
  if (existing[0]) {
    if (existing[0].action === "pass") return existing[0];
    return await base44.entities.JobSwipeAction.update(existing[0].id, {
      action: "pass",
    });
  }
  return await base44.entities.JobSwipeAction.create({
    job_posting_id: jobPostingId,
    action: "pass",
  });
}

// One-time migration: for each HiddenJob record that has no corresponding
// JobSwipeAction "pass", create one. Idempotent — safe to run multiple times.
// Returns the count of newly created pass actions.
export async function migrateHiddenJobsToPassActions(hiddenJobs) {
  if (!hiddenJobs || hiddenJobs.length === 0) return 0;

  const existingPass = await base44.entities.JobSwipeAction.filter(
    { action: "pass" },
    "-created_date",
    500
  );
  const existingIds = new Set(existingPass.map((r) => r.job_posting_id));

  const toCreate = hiddenJobs
    .filter((h) => !existingIds.has(h.job_posting_id))
    .map((h) => ({
      job_posting_id: h.job_posting_id,
      action: "pass",
    }));

  if (toCreate.length === 0) return 0;

  await base44.entities.JobSwipeAction.bulkCreate(toCreate);
  return toCreate.length;
}