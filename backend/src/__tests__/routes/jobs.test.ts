import { createAuthenticatedRequest, createUnauthenticatedRequest } from '../helpers/testRequest';
import { jobsService, JobsUnavailable } from '../../jobs/service';
import { job, manyJobs, payload } from '../jobs/fixtures';
import type { TestUser } from '../helpers/auth';

const user: TestUser = { id: 'signed-in-user', google_id: 'google-id', email: 'user@example.com', name: 'User', picture: '', created_date: '', updated_date: '' };

describe('jobs access API', () => {
  beforeEach(() => { jest.spyOn(jobsService, 'getSnapshot').mockResolvedValue({ payload: payload(manyJobs(45)), stale: false }); });

  it.each([0, 9, 10, 11, 45])('caps guests at ten of %i matching records', async count => {
    jest.mocked(jobsService.getSnapshot).mockResolvedValue({ payload: payload(manyJobs(count)), stale: false });
    const response = await createUnauthenticatedRequest().get('/api/jobs').expect(200);
    expect(response.body).toMatchObject({ total: count, page: 1, pageSize: 10, access: 'guest', previewLimit: 10, requiresAuth: count > 10, stale: false, updatedAt: '2026-10-25T10:00:00Z' });
    expect(response.body.jobs).toHaveLength(Math.min(count, 10));
    expect(response.headers['cache-control']).toBe('private, no-store');
    expect(response.headers.vary).toContain('Cookie');
  });

  it('ignores forged limit/access/offset/identity headers and never embeds remaining records', async () => {
    const response = await createUnauthenticatedRequest()
      .get('/api/jobs?limit=99999&offset=10&access=authenticated&pageSize=99999&authenticated=true')
      .set('Authorization', 'Bearer made-up-token').set('X-Expected-User-Id', user.id).expect(200);
    expect(response.body.jobs).toHaveLength(10);
    expect(response.body.jobs[0].url).toBe('https://jobs.example.com/000');
    expect(response.body.access).toBe('guest');
    expect(JSON.stringify(response.body)).not.toContain('https://jobs.example.com/010');
    expect(Object.keys(response.body).sort()).toEqual(['jobs', 'total', 'page', 'pageSize', 'access', 'previewLimit', 'requiresAuth', 'updatedAt', 'stale'].sort());
  });

  it.each(['2', '99999'])('rejects guest page %s before accessing storage', async page => {
    const response = await createUnauthenticatedRequest().get(`/api/jobs?page=${page}`).expect(401);
    expect(response.body.code).toBe('AUTH_REQUIRED');
    expect(jobsService.getSnapshot).not.toHaveBeenCalled();
    expect(response.headers['cache-control']).toBe('private, no-store');
  });

  it.each(['0', '-1', '1.5', 'hello', '1e2', '1&page=2', '9007199254740992'])('rejects malformed page %s', async page => {
    const response = await createUnauthenticatedRequest().get(`/api/jobs?page=${page}`).expect(400);
    expect(response.body.code).toBe('INVALID_QUERY');
    expect(jobsService.getSnapshot).not.toHaveBeenCalled();
  });

  it('serves authenticated users all pages at twenty records per page', async () => {
    const first = await createAuthenticatedRequest(user).get('/api/jobs?limit=1000').expect(200);
    expect(first.body).toMatchObject({ total: 45, pageSize: 20, previewLimit: null, requiresAuth: false, access: 'authenticated' });
    expect(first.body.jobs).toHaveLength(20);
    const second = await createAuthenticatedRequest(user).get('/api/jobs?page=2').expect(200);
    expect(second.body.jobs).toHaveLength(20);
    expect(second.body.jobs[0].url).toBe('https://jobs.example.com/020');
    const last = await createAuthenticatedRequest(user).get('/api/jobs?page=3').expect(200);
    expect(last.body.jobs).toHaveLength(5);
    const beyond = await createAuthenticatedRequest(user).get('/api/jobs?page=4').expect(200);
    expect(beyond.body.jobs).toEqual([]);
  });

  it('applies all filters before computing the preview and total', async () => {
    jest.mocked(jobsService.getSnapshot).mockResolvedValue({ payload: payload([
      ...manyJobs(25),
      job({ url: 'https://jobs.example.com/target', company: 'Beta', title: 'QA Position', job_category: 'qa', city: 'Haifa', cities: ['Haifa', 'Tel Aviv'],
        regions: ['haifa-krayot'], workModel: 'remote', employmentType: 'contract', seniority: 'junior', technologies: ['Cypress'] }),
      job({ company: 'Beta', refreshState: 'closed' }),
    ]), stale: false });
    const response = await createUnauthenticatedRequest().get('/api/jobs').query({ search: 'חיפה', company: 'Beta', category: ['other', 'qa'], city: 'Haifa',
      region: 'haifa-krayot', workModel: 'remote', employmentType: 'contract', seniority: 'junior' }).expect(200);
    expect(response.body.total).toBe(1);
    expect(response.body.requiresAuth).toBe(false);
    expect(response.body.jobs[0].url).toBe('https://jobs.example.com/target');
    const closed = await createUnauthenticatedRequest().get('/api/jobs?company=Beta&showClosed=true').expect(200);
    expect(closed.body.total).toBe(2);
  });

  it('marks stale last-good results and exposes only a generic 503 for cold failures', async () => {
    jest.mocked(jobsService.getSnapshot).mockResolvedValueOnce({ payload: payload([job()]), stale: true });
    expect((await createUnauthenticatedRequest().get('/api/jobs').expect(200)).body.stale).toBe(true);
    jest.mocked(jobsService.getSnapshot).mockRejectedValueOnce(new JobsUnavailable('Jobs are temporarily unavailable'));
    const response = await createUnauthenticatedRequest().get('/api/jobs').expect(503);
    expect(response.body).toEqual({ code: 'JOBS_UNAVAILABLE', error: 'Jobs are temporarily unavailable' });
  });

  it('exposes catalog summaries to guests without job detail leakage', async () => {
    const response = await createUnauthenticatedRequest().get('/api/jobs/catalog').expect(200);
    expect(response.body.stats).toEqual({ jobs: 45, companies: 1, cities: 1 });
    expect(response.body.companies[0].jobCount).toBe(45);
    for (const marker of ['Engineer 0', 'jobs.example.com', 'Private description', '"jobs":[', '"url":', '"title":', '"description":']) {
      expect(JSON.stringify(response.body)).not.toContain(marker);
    }
  });

  it('does not return an SPA shell or jobs for unknown API paths', async () => {
    const response = await createUnauthenticatedRequest().get('/api/jobs/unlisted').expect(404);
    expect(response.body).toEqual({ error: 'Not found' });
    expect(response.headers['content-type']).toContain('application/json');
    expect(jobsService.getSnapshot).not.toHaveBeenCalled();
  });
});

describe('jobs CSV export', () => {
  it('rejects guests, including forged access parameters, before reading storage', async () => {
    const read = jest.spyOn(jobsService, 'getSnapshot');
    const response = await createUnauthenticatedRequest().get('/api/jobs/export?access=authenticated&limit=100000').expect(401);
    expect(read).not.toHaveBeenCalled();
    expect(response.headers['cache-control']).toBe('private, no-store');
    expect(response.headers.vary).toContain('Cookie');
  });

  it('exports every matching authenticated record, preserving escaping and excluding closed jobs by default', async () => {
    jest.spyOn(jobsService, 'getSnapshot').mockResolvedValue({ payload: payload([
      ...manyJobs(45), job({ title: ' =SUM(1)', company: 'Quoted,"Company"', cityHe: 'חיפה', url: 'https://j/special' }),
      job({ title: 'Closed secret', refreshState: 'closed', url: 'https://j/closed' }),
    ]), stale: false });
    const response = await createAuthenticatedRequest(user).get('/api/jobs/export?limit=1&page=2').expect(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-disposition']).toMatch(/^attachment; filename="techjobs-\d{4}-\d{2}-\d{2}\.csv"$/);
    expect(response.headers['cache-control']).toBe('private, no-store');
    expect(response.headers.vary).toContain('Cookie');
    expect(response.text.charCodeAt(0)).toBe(0xfeff);
    expect(response.text.split('\r\n')).toHaveLength(48); // header + 46 jobs + trailing line
    expect(response.text).toContain("' =SUM(1)");
    expect(response.text).toContain('"Quoted,""Company"""');
    expect(response.text).toContain('חיפה');
    expect(response.text).not.toContain('Closed secret');
    const filtered = await createAuthenticatedRequest(user).get('/api/jobs/export?showClosed=true&search=Closed').expect(200);
    expect(filtered.text).toContain('Closed secret');
    expect(filtered.text).not.toContain('Engineer');
  });
});
