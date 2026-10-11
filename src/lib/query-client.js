import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
		},
	},
});

export const PROFILE_DATA_QUERY_KEY = ["profileData"];
export const SAVED_JOBS_QUERY_KEY = ["savedJobs"];