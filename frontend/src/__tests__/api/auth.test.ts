import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { authApi } from '@/api/auth';

describe('authApi', () => {
  describe('getMe', () => {
    it('should return authenticated state with user when logged in', async () => {
      const result = await authApi.getMe();

      expect(result.authenticated).toBe(true);
      expect(result.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/photo.jpg',
      });
    });

    it('should return unauthenticated state when not logged in', async () => {
      server.use(
        http.get('/auth/me', () => {
          return HttpResponse.json({
            authenticated: false,
            user: null,
          });
        })
      );

      const result = await authApi.getMe();

      expect(result.authenticated).toBe(false);
      expect(result.user).toBeNull();
    });

    it('should return unauthenticated state on network error', async () => {
      server.use(
        http.get('/auth/me', () => {
          return HttpResponse.error();
        })
      );

      const result = await authApi.getMe();

      expect(result.authenticated).toBe(false);
      expect(result.user).toBeNull();
    });

    it('should return unauthenticated state on 401 response', async () => {
      server.use(
        http.get('/auth/me', () => {
          return new HttpResponse(null, { status: 401 });
        })
      );

      const result = await authApi.getMe();

      expect(result.authenticated).toBe(false);
      expect(result.user).toBeNull();
    });
  });

  describe('getLoginUrl', () => {
    it('should construct correct login URL with redirect', () => {
      const redirect = 'http://localhost:5173/jobs';
      const url = authApi.getLoginUrl(redirect);

      expect(url).toBe(`/auth/google?redirect=${encodeURIComponent(redirect)}`);
    });

    it('should use current URL when no redirect provided', () => {
      // Mock window.location
      const originalLocation = window.location.href;
      Object.defineProperty(window, 'location', {
        value: { href: 'http://localhost:5173/saved-jobs' },
        writable: true,
      });

      const url = authApi.getLoginUrl();

      expect(url).toContain('/auth/google?redirect=');
      expect(url).toContain(encodeURIComponent('http://localhost:5173/saved-jobs'));

      // Restore
      Object.defineProperty(window, 'location', {
        value: { href: originalLocation },
        writable: true,
      });
    });
  });

  describe('logout', () => {
    it('should return true on successful logout', async () => {
      const result = await authApi.logout();

      expect(result).toBe(true);
    });

    it('should return false on failed logout', async () => {
      server.use(
        http.post('/auth/logout', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const result = await authApi.logout();

      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      server.use(
        http.post('/auth/logout', () => {
          return HttpResponse.error();
        })
      );

      const result = await authApi.logout();

      expect(result).toBe(false);
    });
  });
});
