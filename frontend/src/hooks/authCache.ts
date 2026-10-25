import type { QueryClient } from '@tanstack/react-query';

/** Remove records from other access scopes before they can be reused. */
export function clearJobAccessCache(queryClient: QueryClient, keepScope?: string) {
  const filters = {
    predicate: (query: { queryKey: readonly unknown[] }) =>
      ['jobs', 'savedJobs'].includes(String(query.queryKey[0])) && query.queryKey[1] !== keepScope,
  };
  // Cancellation is synchronous; do not await before removing the old cache
  // and switching auth, or an old response could briefly become visible.
  void queryClient.cancelQueries(filters);
  queryClient.removeQueries(filters);
}

export function revokeJobAccess(queryClient: QueryClient) {
  clearJobAccessCache(queryClient);
  queryClient.setQueryData(['auth'], { authenticated: false, user: null });
  void queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
}
