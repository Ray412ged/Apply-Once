import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { SAVED_JOBS_QUERY_KEY } from "@/lib/query-client";

/**
 * Central React Query hook for the user's SavedJob records.
 * All views that display saved jobs or saved-job counts should use this
 * hook so that save/unsave actions propagate instantly across screens
 * without requiring navigation or refresh.
 *
 * Returns an array of SavedJob records (each has job_posting_id,
 * saved_date, notes, etc.).
 */
export function useSavedJobs() {
  return useQuery({
    queryKey: SAVED_JOBS_QUERY_KEY,
    queryFn: async () => {
      return await base44.entities.SavedJob.filter({}, "-created_date", 500);
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Returns a function that invalidates the saved-jobs query cache,
 * causing all subscribed components to re-fetch fresh data.
 */
export function useInvalidateSavedJobs() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: SAVED_JOBS_QUERY_KEY });
}