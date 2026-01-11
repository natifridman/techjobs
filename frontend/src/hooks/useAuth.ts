import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';
import { authApi, type AuthState } from '@/api/auth';

export function useAuth() {
  const queryClient = useQueryClient();
  const posthog = usePostHog();

  const { data: authState, isLoading } = useQuery<AuthState>({
    queryKey: ['auth'],
    queryFn: authApi.getMe,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false
  });

  // Identify user in PostHog when authenticated with email and name
  useEffect(() => {
    if (authState?.authenticated && authState.user) {
      posthog.identify(authState.user.id, {
        email: authState.user.email,
        name: authState.user.name,
      });
    }
  }, [authState, posthog]);

  const login = (redirectUrl?: string) => {
    window.location.href = authApi.getLoginUrl(redirectUrl);
  };

  const logout = async () => {
    await authApi.logout();
    posthog.reset(); // Clear PostHog identity on logout
    queryClient.setQueryData(['auth'], { authenticated: false, user: null });
    queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
  };

  return {
    user: authState?.user || null,
    isAuthenticated: authState?.authenticated || false,
    isLoading,
    login,
    logout
  };
}
