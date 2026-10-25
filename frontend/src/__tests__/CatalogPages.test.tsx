import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JobsCatalog } from '@/api/jobs';
import Home from '@/pages/Home';
import Companies from '@/pages/Companies';
import MapPage from '@/pages/Map';

const mocks = vi.hoisted(() => ({ useJobsCatalog: vi.fn(), fitBounds: vi.fn() }));
vi.mock('@/hooks/useJobs', () => ({ useJobsCatalog: mocks.useJobsCatalog }));
vi.mock('@/components/AddCompanyModal', () => ({ default: () => null }));
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TileLayer: () => null, Marker: () => null, Popup: () => null,
  useMap: () => ({ fitBounds: mocks.fitBounds }),
}));
const catalog: JobsCatalog = {
  updatedAt: '2026-10-25T10:00:00Z', stale: false,
  stats: { jobs: 12, companies: 1, cities: 1 },
  facets: { cities: ['Tel Aviv'] }, cityLabels: { 'Tel Aviv': 'Tel Aviv / תל אביב' },
  companies: [{ name: 'Example Tech', jobCount: 12, categories: ['Engineering'], locations: ['Tel Aviv'], jobCategories: ['software', 'data-ai'], latestUpdate: '2026-10-25T10:00:00Z' }],
  cities: [{ city: 'Tel Aviv', jobCount: 12, companies: ['Example Tech'] }],
};
function RouteProbe() { const { pathname, search } = useLocation(); return <output data-testid="route">{pathname}{search}</output>; }
function renderPage(page: React.ReactNode) { return render(<MemoryRouter>{page}<RouteProbe /></MemoryRouter>); }
beforeEach(() => {
  vi.clearAllMocks();
  mocks.useJobsCatalog.mockReturnValue({ data: catalog, isLoading: false, isError: false, refetch: vi.fn() });
});
describe('catalog pages', () => {
  it('submits a keyword search and exposes role links as real destinations', async () => {
    const user = userEvent.setup(); renderPage(<Home />);
    await user.type(screen.getByRole('searchbox', { name: 'Job title, skill or company' }), ' backend & AI ');
    await user.click(screen.getByRole('button', { name: 'Search jobs' }));
    expect(screen.getByTestId('route')).toHaveTextContent('/jobs?search=backend+%26+AI');
    expect(screen.getByRole('link', { name: 'Software' })).toHaveAttribute('href', '/jobs?category=software');
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText(/Catalog updated/)).toBeInTheDocument();
  });
  it('uses real zero counts instead of marketing estimates', () => {
    mocks.useJobsCatalog.mockReturnValue({ data: { ...catalog, stats: { jobs: 0, companies: 0, cities: 0 } }, isLoading: false, isError: false });
    renderPage(<Home />);
    expect(screen.getAllByText('0')).toHaveLength(3);
    expect(screen.queryByText('7,000+')).not.toBeInTheDocument();
  });
  it('keeps job search available when catalog summaries fail', () => {
    mocks.useJobsCatalog.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: vi.fn() });
    renderPage(<Home />);
    expect(screen.getByText(/Catalog counts are temporarily unavailable/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search jobs' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled();
  });
  it('shows role taxonomy labels and matches bilingual company locations', async () => {
    const user = userEvent.setup(); renderPage(<Companies />);
    expect(screen.getByText('Software')).toBeInTheDocument();
    expect(screen.getByText('Data & AI')).toBeInTheDocument();
    expect(screen.queryByText('Engineering')).not.toBeInTheDocument();
    await user.type(screen.getByRole('searchbox'), 'תל אביב');
    expect(screen.getByRole('link', { name: /Example Tech/ })).toBeInTheDocument();
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'nonexistent');
    expect(screen.getByText('No companies found')).toBeInTheDocument();
  });
  it('provides a searchable city list linking to filtered jobs', async () => {
    const user = userEvent.setup(); renderPage(<MapPage />);
    expect(screen.getByRole('link', { name: /Tel Aviv.*12 jobs/ })).toHaveAttribute('href', '/jobs?city=Tel%20Aviv');
    await user.type(screen.getByRole('searchbox', { name: 'Search cities in English or Hebrew' }), 'תל אביב');
    expect(screen.getByRole('link', { name: /Tel Aviv.*12 jobs/ })).toBeInTheDocument();
    expect(mocks.fitBounds).toHaveBeenCalled();
  });
});
