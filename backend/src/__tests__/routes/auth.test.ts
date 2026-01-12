import {
  createTestUser,
  clearAllData,
  createUnauthenticatedRequest,
  createAuthenticatedRequest,
  TestUser,
} from '../helpers';

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
