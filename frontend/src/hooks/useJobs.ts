import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchJobs, fetchJobsCatalog, JobsApiError, jobsQueryParams, type JobsQuery } from '@/api/jobs';
import { useAuth } from '@/hooks/useAuth';
import { revokeJobAccess } from '@/hooks/authCache';

export const jobsQueryKey = (scope: string, query: JobsQuery) => ['jobs', scope, jobsQueryParams(query).toString()] as const;
export const JOBS_CATALOG_QUERY_KEY = ['jobsCatalog'] as const;

export function useJobsCatalog() {
  return useQuery({
    queryKey: JOBS_CATALOG_QUERY_KEY,
    queryFn: ({ signal }) => fetchJobsCatalog(signal),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useJobs(query: JobsQuery = {}, enabled = true) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const scope = auth.isAuthenticated && auth.user ? auth.user.id : 'guest';
  const result = useQuery({
    queryKey: jobsQueryKey(scope, query),
    queryFn: ({ signal }) => fetchJobs(query, signal),
    enabled: enabled && !auth.isLoading,
    staleTime: 60 * 1000,
    retry: (count, error) => !(error instanceof JobsApiError && error.status === 401) && count < 2,
  });

  useEffect(() => {
    const expired = auth.isAuthenticated && (result.data?.access === 'guest'
      || (result.error instanceof JobsApiError && result.error.status === 401));
    if (!expired) return;
    // Server access is authoritative when a cookie expires in another tab.
    revokeJobAccess(queryClient);
  }, [auth.isAuthenticated, result.data?.access, result.error, queryClient, scope]);

  return { ...result, auth, isLoading: auth.isLoading || result.isLoading };
}
