import { afterEach, describe, expect, it, vi } from 'vitest';
import { exportJobsCsv, fetchJobs, fetchJobsCatalog, JobsApiError, jobsQueryParams } from '@/api/jobs';

const response = (extra: Record<string, unknown> = {}) => ({
  jobs: [{ company: 'A', title: 'Engineer', url: 'https://example.com/job', job_category: 'software' }],
  total: 50, page: 1, pageSize: 10, access: 'guest', previewLimit: 10, requiresAuth: true,
  updatedAt: '2026-10-20', stale: false, ...extra,
});
afterEach(() => vi.unstubAllGlobals());
describe('jobs API', () => {
  it('canonicalizes repeated filters, query and page consistently', () => {
    const result = jobsQueryParams({ search: ' Engineer ', city: ['Haifa', 'Tel Aviv', 'Haifa'], category: ['software'], page: 2, showClosed: true });
    expect(result.toString()).toBe('search=Engineer&category=software&city=Haifa&city=Tel+Aviv&showClosed=true&page=2');
  });
  it('fetches only the bounded API response with credentials and cancellation', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => response() })); vi.stubGlobal('fetch', fetchMock);
    const signal = new AbortController().signal; const data = await fetchJobs({ category: ['software'] }, signal);
    expect(fetchMock).toHaveBeenCalledWith('/api/jobs?category=software', { credentials: 'include', cache: 'no-store', signal });
    expect(data.access).toBe('guest'); expect(data.total).toBe(50); expect(data.jobs[0].technologies).toEqual([]);
  });
  it('retains the established record URL validation at the API boundary', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => response({ jobs: [{ company: 'A', title: 'Bad URL', job_category: 'software', url: 'javascript:alert(1)' }] }) })));
    expect((await fetchJobs()).jobs).toEqual([]);
  });
  it('surfaces auth-required errors rather than attempting any public feed fallback', async () => {
    const fetchMock = vi.fn(async () => ({ ok: false, status: 401, json: async () => ({ code: 'AUTH_REQUIRED', error: 'Sign in' }) })); vi.stubGlobal('fetch', fetchMock);
    await expect(fetchJobs({ page: 2 })).rejects.toMatchObject({ name: 'JobsApiError', status: 401, code: 'AUTH_REQUIRED' }); expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('rejects a malformed access envelope', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ jobs: [] }) })));
    await expect(fetchJobs()).rejects.toThrow('Incompatible jobs response');
  });
  it('uses the aggregate catalog endpoint with cancellation', async () => {
    const catalog = { stats: { jobs: 50, companies: 3, cities: 2 }, facets: { cities: ['Haifa'] }, companies: [], cities: [] };
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => catalog })); vi.stubGlobal('fetch', fetchMock);
    const signal = new AbortController().signal; expect(await fetchJobsCatalog(signal)).toEqual(catalog);
    expect(fetchMock).toHaveBeenCalledWith('/api/jobs/catalog', { credentials: 'include', cache: 'no-store', signal });
  });
  it('exports all matching server results and omits pagination', async () => {
    const blob = new Blob(['csv']); const fetchMock = vi.fn(async () => ({ ok: true, blob: async () => blob })); vi.stubGlobal('fetch', fetchMock);
    const signal = new AbortController().signal; expect(await exportJobsCsv({ city: ['Haifa'], page: 3 }, signal)).toBe(blob);
    expect(fetchMock).toHaveBeenCalledWith('/api/jobs/export?city=Haifa', { credentials: 'include', cache: 'no-store', signal });
  });
  it('retains error metadata for export sign-in recovery', () => {
    expect(new JobsApiError('Sign in', 401, 'AUTH_REQUIRED')).toMatchObject({ message: 'Sign in', status: 401, code: 'AUTH_REQUIRED' });
  });
});
