import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Link, useLocation, useNavigate } from 'react-router-dom';
import Jobs from '@/pages/Jobs';
import CompanyProfile from '@/pages/CompanyProfile';
import { parseJobsPayload, type Job } from '@/components/jobs/jobsData';

const LOGIN = vi.fn();
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ isLoading: false, isAuthenticated: false, user: null, login: LOGIN }) }));
vi.mock('posthog-js/react', () => ({ usePostHog: () => ({ capture: vi.fn() }) }));
const JOBS = parseJobsPayload({ jobs: [
  { company: 'A', title: 'Backend Engineer', url: 'https://x/1', job_category: 'software', cities: ['Tel Aviv'], updated: '2026-10-17' },
  { company: 'B', title: 'Product Designer', url: 'https://x/2', job_category: 'design', cities: ['Haifa'], updated: '2026-10-16' },
] }).jobs;

function mockApi(rows: Job[] = JOBS, cityLabels: Record<string, string> = { 'Tel Aviv': 'תל אביב', Haifa: 'חיפה' }) {
  const calls: URL[] = [];
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input), 'https://example.test'); calls.push(url);
    if (url.pathname.includes('/saved-jobs')) return { ok: false, status: 401, json: async () => ({}) } as Response;
    if (url.pathname === '/auth/me') return { ok: true, json: async () => ({ authenticated: false, user: null }) } as Response;
    if (url.pathname.endsWith('/catalog')) return { ok: true, json: async () => ({
      updatedAt: '2026-10-18', stale: false, cityLabels, facets: { cities: [...new Set(rows.flatMap(job => job.cities))] },
      stats: { jobs: rows.length, companies: 2, cities: 2 }, companies: [{ name: 'A', jobCount: rows.length, categories: [], locations: ['Tel Aviv'], jobCategories: ['software'], latestUpdate: null }], cities: [],
    }) } as Response;
    const p = url.searchParams;
    const filtered = rows.filter(job => (!p.get('company') || p.get('company') === job.company)
      && (!p.has('category') || p.getAll('category').includes(job.job_category))
      && (!p.has('city') || job.cities.some(city => p.getAll('city').includes(city)))
      && (!p.get('search') || `${job.title} ${job.company}`.toLowerCase().includes(p.get('search')!.toLowerCase())));
    return { ok: true, json: async () => ({ jobs: filtered.slice(0, 10), total: filtered.length, page: 1, pageSize: 10,
      previewLimit: 10, access: 'guest', requiresAuth: filtered.length > 10, stale: false, updatedAt: '2026-10-18' }) } as Response;
  })); return calls;
}
function Navigation() {
  const location = useLocation(); const navigate = useNavigate();
  return <><Link to="/jobs">plain-jobs</Link><button onClick={() => navigate(-1)}>Back in history</button><output data-testid="location">{location.pathname}{location.search}{location.hash}</output></>;
}
function renderJobs(route: string, profile = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[route]}><Navigation />{profile ? <CompanyProfile /> : <Jobs />}</MemoryRouter></QueryClientProvider>);
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); LOGIN.mockReset(); localStorage.clear(); });

describe('Jobs URL params', () => {
  it('applies a valid category slug through the jobs API', async () => {
    const calls = mockApi(); renderJobs('/jobs?category=software'); await screen.findByText('Backend Engineer');
    expect(screen.queryByText('Product Designer')).toBeNull(); expect(calls.some(url => url.pathname === '/api/jobs' && url.searchParams.get('category') === 'software')).toBe(true);
  });
  it.each(['bogus-slug', 'toString', '__proto__'])('ignores invalid category %s instead of silently emptying the board', async category => {
    mockApi(); renderJobs(`/jobs?category=${category}`); await screen.findByText('Backend Engineer'); await screen.findByText('Product Designer');
    expect(screen.getByTestId('location').textContent).not.toContain('category=');
  });
  it('drops an unknown city once the catalog canonical city list loads', async () => {
    mockApi(); renderJobs('/jobs?city=BogusCity'); await screen.findByText('Backend Engineer'); await screen.findByText('Product Designer');
    expect(screen.getByTestId('location').textContent).not.toContain('city=');
  });
  it('keeps a valid city parameter', async () => {
    mockApi(); renderJobs('/jobs?city=Tel Aviv'); await screen.findByText('Backend Engineer'); expect(screen.queryByText('Product Designer')).toBeNull();
  });
  it('keeps valid canonical cities missing from the translation table', async () => {
    mockApi([{ ...JOBS[0], cities: ['Ashdod'] }, JOBS[1]], { Haifa: 'חיפה' }); renderJobs('/jobs?city=Ashdod'); await screen.findByText('Backend Engineer');
    expect(screen.queryByText('Product Designer')).toBeNull(); expect(screen.getByTestId('location').textContent).toContain('city=Ashdod');
  });
  it.each(['category=software', 'city=Tel%20Aviv'])('clears the URL-derived %s filter when its parameter disappears', async query => {
    mockApi(); renderJobs(`/jobs?${query}`); await screen.findByText('Backend Engineer'); expect(screen.queryByText('Product Designer')).toBeNull();
    fireEvent.click(screen.getByText('plain-jobs')); await screen.findByText('Product Designer');
  });
  it('supports repeated facets and browser back/forward', async () => {
    mockApi(); renderJobs('/jobs?category=software&category=design&workModel=remote&seniority=senior'); await screen.findByText('Backend Engineer'); await screen.findByText('Product Designer');
    fireEvent.click(screen.getByRole('button', { name: 'Remove filter: Design' })); await waitFor(() => expect(screen.queryByText('Product Designer')).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: 'Back in history' })); await screen.findByText('Product Designer'); expect(screen.getByTestId('location').textContent).toContain('workModel=remote');
  });
  it('debounces keywords into the URL and resets a guest page to one', async () => {
    mockApi(); renderJobs('/jobs?page=3'); await screen.findByText('Backend Engineer'); expect(screen.getByTestId('location').textContent).not.toContain('page=');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Designer' } }); expect(screen.getByTestId('location').textContent).not.toContain('search=Designer');
    await waitFor(() => expect(screen.getByTestId('location').textContent).toContain('search=Designer')); await waitFor(() => expect(screen.queryByText('Backend Engineer')).toBeNull());
  });
  it('clears search, company and all chips together', async () => {
    mockApi(); renderJobs('/jobs?search=Engineer&category=software&company=A'); await screen.findByText('Backend Engineer');
    fireEvent.click(screen.getByRole('button', { name: /Clear all/ })); await screen.findByText('Product Designer'); expect(screen.getByTestId('location').textContent).toBe('/jobs'); expect(screen.getByRole('searchbox')).toHaveValue('');
  });
});

describe('guest browsing', () => {
  const manyJobs = Array.from({ length: 24 }, (_, index) => ({ ...JOBS[0], title: `Engineer ${index + 1}`, url: `https://x/${index}` }));
  it('renders ten jobs followed by the inline gate with no pagination', async () => {
    mockApi(manyJobs); renderJobs('/jobs'); await screen.findByText('Engineer 10'); expect(screen.getAllByRole('article')).toHaveLength(10); expect(screen.queryByText('Engineer 11')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Keep exploring Israeli tech jobs' })).toBeInTheDocument(); expect(screen.getByText('Showing 10 of 24 matching jobs')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Job results pages' })).toBeNull(); fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));
    expect(LOGIN).toHaveBeenCalledWith(expect.stringContaining('#continue-jobs'));
  });
  it('does not show a gate for ten or fewer results', async () => {
    mockApi(manyJobs.slice(0, 10)); renderJobs('/jobs'); await screen.findByText('Engineer 10'); expect(screen.queryByText('Keep exploring Israeli tech jobs')).toBeNull();
  });
  it('discards cancelled mobile changes and commits only Show results', async () => {
    mockApi(); renderJobs('/jobs'); await screen.findByText('Product Designer'); fireEvent.click(screen.getByRole('button', { name: 'Open filters' }));
    let dialog = screen.getByRole('dialog', { name: 'Filter jobs' }); fireEvent.click(within(dialog).getByLabelText('Software'));
    expect(screen.getByTestId('location').textContent).not.toContain('category='); fireEvent.click(within(dialog).getByRole('button', { name: /^Cancel$/ }));
    expect(screen.queryByRole('dialog')).toBeNull(); fireEvent.click(screen.getByRole('button', { name: 'Open filters' })); dialog = screen.getByRole('dialog');
    expect(within(dialog).getByLabelText('Software')).toHaveAttribute('data-state', 'unchecked'); fireEvent.click(within(dialog).getByLabelText('Software'));
    fireEvent.click(within(dialog).getByRole('button', { name: /Show results/ })); await waitFor(() => expect(screen.queryByText('Product Designer')).toBeNull()); expect(screen.getByTestId('location').textContent).toContain('category=software');
  });
  it('keeps save and mark-applied tracking available locally', async () => {
    mockApi(); renderJobs('/jobs'); await screen.findByText('Backend Engineer'); fireEvent.click(screen.getByRole('button', { name: 'Save Backend Engineer' }));
    await waitFor(() => expect(JSON.parse(localStorage.getItem('techjobs_saved_jobs') || '[]')).toHaveLength(1)); await screen.findByRole('button', { name: 'Remove Backend Engineer from saved jobs' });
    fireEvent.click(screen.getByRole('button', { name: 'Mark Backend Engineer as applied' })); await waitFor(() => expect(JSON.parse(localStorage.getItem('techjobs_saved_jobs') || '[]')[0].applied).toBe(true));
  });
  it('uses the same company preview gate and honestly labels the website search', async () => {
    mockApi(manyJobs); renderJobs('/companyprofile?name=A', true); await screen.findByText('Engineer 10'); expect(screen.getAllByRole('article')).toHaveLength(10);
    expect(screen.getByText('Keep exploring Israeli tech jobs')).toBeInTheDocument(); expect(screen.getByRole('link', { name: 'Find company website' })).toHaveAttribute('href', expect.stringContaining('google.com/search'));
    expect(screen.getAllByText('Software').length).toBeGreaterThan(0);
  });
});
