import {
  clearAllData,
  insertCompany,
  getCompanyById,
  createUnauthenticatedRequest,
  createAuthenticatedRequest,
  createTestUser,
  generateTestId,
  TestUser,
} from '../helpers';

describe('Companies Routes', () => {
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

  describe('GET /api/companies', () => {
    it('should return empty array when no companies', async () => {
      const response = await createUnauthenticatedRequest()
        .get('/api/companies')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all companies ordered by name', async () => {
      const now = new Date().toISOString();

      await insertCompany({
        id: generateTestId(),
        name: 'Beta Corp',
        description: 'Beta description',
        created_date: now,
        updated_date: now,
      });

      await insertCompany({
        id: generateTestId(),
        name: 'Alpha Inc',
        description: 'Alpha description',
        created_date: now,
        updated_date: now,
      });

      const response = await createUnauthenticatedRequest()
        .get('/api/companies')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Alpha Inc');
      expect(response.body[1].name).toBe('Beta Corp');
    });

    it('should return similar_companies as array', async () => {
      const now = new Date().toISOString();
      const similarCompanies = ['Company A', 'Company B'];

      await insertCompany({
        id: generateTestId(),
        name: 'Test Corp',
        similar_companies: similarCompanies,
        created_date: now,
        updated_date: now,
      });

      const response = await createUnauthenticatedRequest()
        .get('/api/companies')
        .expect(200);

      expect(response.body[0].similar_companies).toEqual(similarCompanies);
    });
  });

  describe('GET /api/companies/:id', () => {
    it('should return company by ID', async () => {
      const companyId = generateTestId();
      const now = new Date().toISOString();
      await insertCompany({
        id: companyId,
        name: 'Test Corp',
        description: 'A great company',
        website_url: 'https://test.com',
        created_date: now,
        updated_date: now,
      });

      const response = await createUnauthenticatedRequest()
        .get(`/api/companies/${companyId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: companyId,
        name: 'Test Corp',
        description: 'A great company',
        website_url: 'https://test.com',
      });
    });

    it('should return 404 for non-existent ID', async () => {
      const nonExistentId = generateTestId();
      const response = await createUnauthenticatedRequest()
        .get(`/api/companies/${nonExistentId}`)
        .expect(404);

      expect(response.body).toEqual({ error: 'Company not found' });
    });
  });

  describe('GET /api/companies/by-name/:name', () => {
    it('should return company by name', async () => {
      const companyId = generateTestId();
      const now = new Date().toISOString();
      await insertCompany({
        id: companyId,
        name: 'Test Corp',
        description: 'A great company',
        created_date: now,
        updated_date: now,
      });

      const response = await createUnauthenticatedRequest()
        .get(`/api/companies/by-name/${encodeURIComponent('Test Corp')}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: companyId,
        name: 'Test Corp',
      });
    });

    it('should return 404 for non-existent name', async () => {
      const response = await createUnauthenticatedRequest()
        .get(`/api/companies/by-name/${encodeURIComponent('Non Existent')}`)
        .expect(404);

      expect(response.body).toEqual({ error: 'Company not found' });
    });
  });

  describe('POST /api/companies', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await createUnauthenticatedRequest()
        .post('/api/companies')
        .send({ name: 'Test Corp' })
        .expect(401);

      expect(response.body).toEqual({ error: 'Authentication required' });
    });

    it('should create a new company when authenticated', async () => {
      const response = await createAuthenticatedRequest(testUser)
        .post('/api/companies')
        .send({
          name: 'New Corp',
          description: 'A new company',
          website_url: 'https://newcorp.com',
          founded_year: '2020',
          headquarters: 'Tel Aviv',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'New Corp',
        description: 'A new company',
        website_url: 'https://newcorp.com',
        founded_year: '2020',
        headquarters: 'Tel Aviv',
      });
      expect(response.body.id).toBeDefined();
    });

    it('should create company with similar_companies array', async () => {
      const response = await createAuthenticatedRequest(testUser)
        .post('/api/companies')
        .send({
          name: 'New Corp',
          similar_companies: ['Company A', 'Company B'],
        })
        .expect(201);

      expect(response.body.similar_companies).toEqual(['Company A', 'Company B']);
    });

    it('should return 400 when name is missing', async () => {
      const response = await createAuthenticatedRequest(testUser)
        .post('/api/companies')
        .send({
          description: 'A company without a name',
        })
        .expect(400);

      expect(response.body).toEqual({ error: 'name is required' });
    });

    it('should return 409 for duplicate name', async () => {
      const now = new Date().toISOString();
      await insertCompany({
        id: generateTestId(),
        name: 'Existing Corp',
        created_date: now,
        updated_date: now,
      });

      const response = await createAuthenticatedRequest(testUser)
        .post('/api/companies')
        .send({
          name: 'Existing Corp',
        })
        .expect(409);

      expect(response.body).toEqual({ error: 'Company with this name already exists' });
    });
  });

  describe('PUT /api/companies/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const companyId = generateTestId();
      const response = await createUnauthenticatedRequest()
        .put(`/api/companies/${companyId}`)
        .send({ description: 'Updated' })
        .expect(401);

      expect(response.body).toEqual({ error: 'Authentication required' });
    });

    it('should update company when authenticated', async () => {
      const companyId = generateTestId();
      const now = new Date().toISOString();
      await insertCompany({
        id: companyId,
        name: 'Update Corp',
        description: 'Original description',
        created_date: now,
        updated_date: now,
      });

      const response = await createAuthenticatedRequest(testUser)
        .put(`/api/companies/${companyId}`)
        .send({ description: 'Updated description' })
        .expect(200);

      expect(response.body.description).toBe('Updated description');
    });

    it('should update similar_companies', async () => {
      const companyId = generateTestId();
      const now = new Date().toISOString();
      await insertCompany({
        id: companyId,
        name: 'Similar Corp',
        created_date: now,
        updated_date: now,
      });

      const response = await createAuthenticatedRequest(testUser)
        .put(`/api/companies/${companyId}`)
        .send({ similar_companies: ['Related A', 'Related B'] })
        .expect(200);

      expect(response.body.similar_companies).toEqual(['Related A', 'Related B']);
    });

    it('should return 404 for non-existent ID', async () => {
      const nonExistentId = generateTestId();
      const response = await createAuthenticatedRequest(testUser)
        .put(`/api/companies/${nonExistentId}`)
        .send({ description: 'Updated' })
        .expect(404);

      expect(response.body).toEqual({ error: 'Company not found' });
    });

    it('should return 400 when no valid fields provided', async () => {
      const companyId = generateTestId();
      const now = new Date().toISOString();
      await insertCompany({
        id: companyId,
        name: 'No Update Corp',
        created_date: now,
        updated_date: now,
      });

      const response = await createAuthenticatedRequest(testUser)
        .put(`/api/companies/${companyId}`)
        .send({ invalid_field: 'value' })
        .expect(400);

      expect(response.body).toEqual({ error: 'No valid fields to update' });
    });
  });

  describe('PUT /api/companies/by-name/:name', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await createUnauthenticatedRequest()
        .put(`/api/companies/by-name/${encodeURIComponent('Test Corp')}`)
        .send({ description: 'Updated' })
        .expect(401);

      expect(response.body).toEqual({ error: 'Authentication required' });
    });

    it('should create new company if not exists (upsert) when authenticated', async () => {
      const response = await createAuthenticatedRequest(testUser)
        .put(`/api/companies/by-name/${encodeURIComponent('New Upsert Corp')}`)
        .send({
          description: 'Created via upsert',
          website_url: 'https://upsert.com',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'New Upsert Corp',
        description: 'Created via upsert',
        website_url: 'https://upsert.com',
      });
    });

    it('should update existing company (upsert)', async () => {
      const companyId = generateTestId();
      const now = new Date().toISOString();
      await insertCompany({
        id: companyId,
        name: 'Existing Upsert Corp',
        description: 'Original',
        created_date: now,
        updated_date: now,
      });

      const response = await createAuthenticatedRequest(testUser)
        .put(`/api/companies/by-name/${encodeURIComponent('Existing Upsert Corp')}`)
        .send({
          description: 'Updated via upsert',
        })
        .expect(200);

      expect(response.body.description).toBe('Updated via upsert');
      expect(response.body.id).toBe(companyId);
    });
  });

  describe('DELETE /api/companies/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const companyId = generateTestId();
      const response = await createUnauthenticatedRequest()
        .delete(`/api/companies/${companyId}`)
        .expect(401);

      expect(response.body).toEqual({ error: 'Authentication required' });
    });

    it('should delete company when authenticated', async () => {
      const companyId = generateTestId();
      const now = new Date().toISOString();
      await insertCompany({
        id: companyId,
        name: 'Delete Corp',
        created_date: now,
        updated_date: now,
      });

      await createAuthenticatedRequest(testUser)
        .delete(`/api/companies/${companyId}`)
        .expect(204);

      // Verify it's deleted
      const company = await getCompanyById(companyId);
      expect(company).toBeFalsy();
    });

    it('should return 404 for non-existent ID', async () => {
      const nonExistentId = generateTestId();
      const response = await createAuthenticatedRequest(testUser)
        .delete(`/api/companies/${nonExistentId}`)
        .expect(404);

      expect(response.body).toEqual({ error: 'Company not found' });
    });
  });
});
