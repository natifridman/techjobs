import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { useAuth } from '@/hooks/useAuth';
import { mockUser } from '../mocks/handlers';
import React from 'react';

// Mock PostHog
vi.mock('posthog-js/react', () => ({
  usePostHog: () => ({
    identify: vi.fn(),
    reset: vi.fn(),
  }),
}));

// Create wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('useAuth', () => {
  describe('when authenticated', () => {
    it('should return user and isAuthenticated true', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Wait for query to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should provide login function that redirects', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock window.location
      const originalHref = window.location.href;
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
        configurable: true,
      });

      result.current.login('http://localhost:5173/jobs');

      expect(mockLocation.href).toContain('/auth/google');
      expect(mockLocation.href).toContain('redirect=');

      // Restore
      Object.defineProperty(window, 'location', {
        value: { href: originalHref },
        writable: true,
        configurable: true,
      });
    });

    it('should provide logout function', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Call logout
      await result.current.logout();

      // After logout, user should be null (query invalidated)
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });
    });
  });

  describe('when not authenticated', () => {
    beforeEach(() => {
      server.use(
        http.get('/auth/me', () => {
          return HttpResponse.json({
            authenticated: false,
            user: null,
          });
        })
      );
    });

    it('should return null user and isAuthenticated false', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('on error', () => {
    beforeEach(() => {
      server.use(
        http.get('/auth/me', () => {
          return HttpResponse.error();
        })
      );
    });

    it('should handle network errors gracefully', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // On error, should return unauthenticated state
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });
});
