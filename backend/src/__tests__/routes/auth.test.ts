import {
  createTestUser,
  clearAllData,
  createUnauthenticatedRequest,
  createAuthenticatedRequest,
  TestUser,
} from '../helpers';
import request from 'supertest';
import passport from '../../config/passport';
import { createAppWithAuth } from '../helpers/testRequest';
import { safeReturnTo } from '../../routes/auth';

describe('Auth Routes', () => {
  let testUser: TestUser;

  beforeEach(async () => {
    await clearAllData();
    testUser = await createTestUser({
      name: 'Test User',
      email: 'test@example.com',
    });
  });

  afterAll(async () => {
    await clearAllData();
  });

  describe('GET /auth/me', () => {
    it('should return authenticated: false when not logged in', async () => {
      const response = await createUnauthenticatedRequest()
        .get('/auth/me')
        .expect(200);

      expect(response.body).toEqual({
        authenticated: false,
        user: null,
      });
    });

    it('should return user data when authenticated', async () => {
      const response = await createAuthenticatedRequest(testUser)
        .get('/auth/me')
        .expect(200);

      expect(response.body).toEqual({
        authenticated: true,
        user: {
          id: testUser.id,
          email: testUser.email,
          name: testUser.name,
          picture: testUser.picture,
        },
      });
    });
  });

  describe('POST /auth/logout', () => {
    it('should return success for unauthenticated user', async () => {
      const response = await createUnauthenticatedRequest()
        .post('/auth/logout')
        .expect(200);

      expect(response.body).toEqual({ success: true });
    });

    it('should return success for authenticated user', async () => {
      const response = await createAuthenticatedRequest(testUser)
        .post('/auth/logout')
        .expect(200);

      expect(response.body).toEqual({ success: true });
    });
  });

  describe('GET /auth/failure', () => {
    it('should return 401 with error message', async () => {
      const response = await createUnauthenticatedRequest()
        .get('/auth/failure')
        .expect(401);

      expect(response.body).toEqual({
        error: 'Authentication failed',
      });
    });
  });

  describe('GET /auth/google', () => {
    it('should redirect to Google OAuth (when configured)', async () => {
      // Note: Without Google OAuth configured, this will fail
      // We're just testing that the route exists and accepts the redirect param
      const response = await createUnauthenticatedRequest()
        .get('/auth/google?redirect=http://localhost:5173')
        .redirects(0);

      // It should either redirect to Google or return an error if not configured
      expect([302, 500]).toContain(response.status);
    });
  });
});

describe('authFailureRedirect', () => {
  const ORIGINAL = process.env.FRONTEND_URL;

  afterEach(() => {
    if (ORIGINAL === undefined) {
      delete process.env.FRONTEND_URL;
    } else {
      process.env.FRONTEND_URL = ORIGINAL;
    }
  });

  it('points browsers back at the app with an authError flag', async () => {
    process.env.FRONTEND_URL = 'https://techjobsil.com/';
    const { authFailureRedirect } = await import('../../routes/auth');
    expect(authFailureRedirect()).toBe('https://techjobsil.com/?authError=1');
  });

  it('falls back to the local dev frontend', async () => {
    delete process.env.FRONTEND_URL;
    const { authFailureRedirect } = await import('../../routes/auth');
    expect(authFailureRedirect()).toBe('http://localhost:8080/?authError=1');
  });

  it('preserves the search and continuation hash after cancellation', async () => {
    process.env.FRONTEND_URL = 'https://techjobsil.com';
    const { authFailureRedirect } = await import('../../routes/auth');
    expect(authFailureRedirect('/jobs?category=software&city=Haifa#continue-jobs'))
      .toBe('https://techjobsil.com/jobs?category=software&city=Haifa&authError=1#continue-jobs');
  });

  it.each(['https://evil.test/jobs', '//evil.test/jobs', 'javascript:alert(1)',
    'https://techjobsil.com.evil.test/', 'https://user:pass@techjobsil.com/jobs', '/\\evil.test/jobs'])
  ('rejects an unsafe OAuth destination: %s', (destination) => {
    process.env.FRONTEND_URL = 'https://techjobsil.com';
    expect(safeReturnTo(destination)).toBe('https://techjobsil.com/');
  });
});

describe('OAuth continuation', () => {
  const originalFrontend = process.env.FRONTEND_URL;
  afterEach(() => {
    jest.restoreAllMocks();
    if (originalFrontend === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = originalFrontend;
  });

  it.each([true, false])('retains filters and hash when OAuth succeeds=%s', async (succeeds) => {
    process.env.FRONTEND_URL = 'https://techjobsil.com';
    const user = await createTestUser({ name: 'Returning visitor' });
    const originalAuthenticate = passport.authenticate.bind(passport);
    jest.spyOn(passport, 'authenticate').mockImplementation(((name: string, options: unknown) => {
      if (name !== 'google') return originalAuthenticate(name, options as never);
      return (_req: unknown, res: { redirect: (url: string) => void }) => {
        if (typeof options === 'function') options(null, succeeds ? user : false);
        else res.redirect('https://accounts.google.com/mock');
      };
    }) as typeof passport.authenticate);
    const agent = request.agent(createAppWithAuth());
    const destination = '/jobs?search=backend&category=software#continue-jobs';
    await agent.get('/auth/google').query({ redirect: destination }).expect(302);
    const response = await agent.get('/auth/google/callback').expect(302);
    expect(response.headers.location).toBe(succeeds
      ? `https://techjobsil.com${destination}`
      : 'https://techjobsil.com/jobs?search=backend&category=software&authError=1#continue-jobs');
    if (succeeds) {
      const me = await agent.get('/auth/me').expect(200);
      expect(me.body.user.id).toBe(user.id);
      expect(me.headers['cache-control']).toBe('private, no-store');
    }
  });
});
