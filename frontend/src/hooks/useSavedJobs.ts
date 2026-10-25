import { useQuery } from '@tanstack/react-query';
import { savedJobsApi } from '@/api/storage';
import { useAuth } from './useAuth';

/** A guest/new account must never render another account's saved rows or notes. */
export function useSavedJobs() {
  const auth = useAuth();
  const scope = auth.isAuthenticated && auth.user ? auth.user.id : 'guest';
  const result = useQuery({
    queryKey: ['savedJobs', scope],
    queryFn: () => savedJobsApi.list('-created_date'),
    enabled: !auth.isLoading,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
  return { ...result, isLoading: auth.isLoading || result.isLoading };
}
