import { useQuery, useQueryClient } from "@tanstack/react-query";
import { loadProfileCompletion } from "@/lib/profileUtils";
import { PROFILE_DATA_QUERY_KEY } from "@/lib/query-client";

/**
 * Central React Query hook for loading reusable user profile data.
 * All pages that need profile information should use this hook instead of
 * calling loadProfileCompletion() directly, so that navigating between
 * pages does not repeatedly fetch the same unchanged data.
 *
 * Returns the same shape as loadProfileCompletion():
 *   { sections, sectionStatuses, percentage, profile, preferences,
 *     counts, employmentRecords, educationRecords, skills,
 *     credentials, references, documents }
 */
export function useProfileData() {
  return useQuery({
    queryKey: PROFILE_DATA_QUERY_KEY,
    queryFn: loadProfileCompletion,
    staleTime: 5 * 60 * 1000, // 5 minutes — profile data changes infrequently
  });
}

/**
 * Returns a function that invalidates the profile-data query, causing
 * the next consumer to re-fetch fresh data. Call this after any profile
 * mutation (create/update/delete on profile entities).
 */
export function useInvalidateProfileData() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: PROFILE_DATA_QUERY_KEY });
}