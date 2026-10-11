// Shared utilities for SavedJob operations.
// SavedJob is the single source of truth for all saved jobs across the app.
// JobSwipeAction is kept only for swipe-history behavior (excluding swiped
// jobs from future Discovery batches).

import { base44 } from "@/api/base44Client";
import { queryClientInstance, SAVED_JOBS_QUERY_KEY } from "@/lib/query-client";

// Invalidate the React Query cache for saved jobs so all subscribed
// components (Discovery, List View, counts) re-fetch immediately.
function invalidateSavedJobsCache() {
  queryClientInstance.invalidateQueries({ queryKey: SAVED_JOBS_QUERY_KEY });
}

// Get or create a SavedJob record for a given job posting.
// Prevents duplicate SavedJob records for the same user and job.
export async function getOrCreateSavedJob(jobPostingId) {
  const existing = await base44.entities.SavedJob.filter(
    { job_posting_id: jobPostingId },
    "-created_date",
    1
  );
  if (existing[0]) return existing[0];

  const created = await base44.entities.SavedJob.create({
    job_posting_id: jobPostingId,
    saved_date: new Date().toISOString(),
  });
  invalidateSavedJobsCache();
  return created;
}

// Remove the SavedJob record for a given job posting (if one exists).
// Returns the deleted record ID, or null if none existed.
export async function removeSavedJob(jobPostingId) {
  const existing = await base44.entities.SavedJob.filter(
    { job_posting_id: jobPostingId },
    "-created_date",
    1
  );
  if (existing[0]) {
    await base44.entities.SavedJob.delete(existing[0].id);
    invalidateSavedJobsCache();
    return existing[0].id;
  }
  return null;
}