import { base44 } from "@/api/base44Client";

/**
 * The authoritative initial status for a new Application record.
 * Every entry point that creates an application uses this constant.
 */
export const DEFAULT_APPLICATION_STATUS = "Interested";

/**
 * The default method by which an application is submitted.
 */
export const DEFAULT_SUBMISSION_METHOD = "External Link";

/**
 * Returns the current user's Application record for the given job,
 * creating one if none exists yet.
 *
 * This is the SINGLE source of truth for Application creation across
 * the app ("Apply Once"). All pages that need to ensure an application
 * exists must call this function instead of independently filtering
 * and creating.
 *
 * Behaviour:
 *   - Queries the database for an existing Application for this job.
 *   - Returns the existing record UNCHANGED when found (never modifies
 *     status, dates, notes, or any other field on an existing record).
 *   - Creates exactly one record with consistent defaults when none exists.
 *
 * Race-condition safeguard:
 *   The filter-then-create pattern is the strongest deduplication the
 *   Base44 platform permits (no unique constraints / atomic upserts).
 *   The Application entity's RLS scopes the filter to the current user,
 *   so only that user's records are considered.  A duplicate can still
 *   arise if two concurrent calls pass the filter before either creates,
 *   but in practice the calls are user-driven (button clicks) and
 *   sequential within a single page.
 *
 * @param {string} jobId - The JobPosting ID.
 * @param {object} [options] - Optional overrides for a newly created record.
 *   @param {string} [options.status] - Override the default status.
 *   @param {string} [options.submission_method] - Override the default submission method.
 *   @param {string} [options.notes] - Initial notes.
 *   @param {string} [options.application_started_date] - Override the started date (ISO string).
 *   @param {string} [options.application_submitted_date] - Set the submitted date (ISO string).
 * @returns {Promise<object>} The existing or newly created Application record.
 */
export async function getOrCreateApplication(jobId, options = {}) {
  // 1. Check for an existing Application for this job (RLS scopes to current user)
  const existing = await base44.entities.Application.filter(
    { job_posting_id: jobId },
    "-created_date",
    1
  );
  if (existing[0]) {
    return existing[0];
  }

  // 2. No existing record — create one with consistent defaults
  const created = await base44.entities.Application.create({
    job_posting_id: jobId,
    status: options.status || DEFAULT_APPLICATION_STATUS,
    application_started_date: options.application_started_date || new Date().toISOString(),
    submission_method: options.submission_method || DEFAULT_SUBMISSION_METHOD,
    ...(options.notes ? { notes: options.notes } : {}),
    ...(options.application_submitted_date ? { application_submitted_date: options.application_submitted_date } : {}),
  });

  return created;
}