import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JobsCatalog } from '@/api/jobs';
import Home from '@/pages/Home';
import Companies from '@/pages/Companies';
import MapPage from '@/pages/Map';

const mocks = vi.hoisted(() => ({ useJobsCatalog: vi.fn(), fitBounds: vi.fn(), tileLayer: vi.fn() }));
vi.mock('@/hooks/useJobs', () => ({ useJobsCatalog: mocks.useJobsCatalog }));
vi.mock('@/components/home/HomeJobPreview', () => ({ default: () => null }));
vi.mock('@/components/map/ClusteredMarkers', () => ({ default: () => null }));
vi.mock('@/components/AddCompanyModal', () => ({ default: () => null }));
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TileLayer: (props: unknown) => { mocks.tileLayer(props); return null; }, Marker: () => null, Popup: () => null,
  useMap: () => ({ fitBounds: mocks.fitBounds }),
}));
const catalog: JobsCatalog = {
  updatedAt: '2026-10-25T10:00:00Z', stale: false,
  stats: { jobs: 12, companies: 1, cities: 1 }, categoryCounts: { software: 8, 'data-ai': 4 },
  facets: { cities: ['Tel Aviv'] }, cityLabels: { 'Tel Aviv': 'Tel Aviv / תל אביב' },
  companies: [{ name: 'Example Tech', jobCount: 12, categories: ['Engineering'], locations: ['Tel Aviv'], jobCategories: ['software', 'data-ai'], latestUpdate: '2026-10-25T10:00:00Z' }],
  cities: [{ city: 'Tel Aviv', jobCount: 12, companies: ['Example Tech'] }],
};
function RouteProbe() { const { pathname, search } = useLocation(); return <output data-testid="route">{pathname}{search}</output>; }
function renderPage(page: React.ReactNode, route = "/") { return render(<MemoryRouter initialEntries={[route]}>{page}<RouteProbe /></MemoryRouter>); }
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
    expect(screen.getByRole('link', { name: /Software.*8 open roles/ })).toHaveAttribute('href', '/jobs?category=software');
    expect(screen.getAllByText('12').length).toBeGreaterThan(0);
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
    expect(screen.getAllByText('Software').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Data & AI').length).toBeGreaterThan(0);
    expect(screen.queryByText('Engineering')).not.toBeInTheDocument();
    await user.type(screen.getByRole('searchbox'), 'תל אביב');
    expect(screen.getByRole('link', { name: /Example Tech/ })).toBeInTheDocument();
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'nonexistent');
    expect(screen.getByText('No companies found')).toBeInTheDocument();
  });
  it('submits a canonical location together with a keyword and handles unknown locations', async () => {
    const user = userEvent.setup(); renderPage(<Home />);
    await user.type(screen.getByRole('searchbox', { name: 'Job title, skill or company' }), 'Engineer');
    await user.type(screen.getByRole('combobox', { name: 'Where?' }), 'unknown');
    await user.click(screen.getByRole('button', { name: 'Search jobs' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a location');
    await user.clear(screen.getByRole('combobox', { name: 'Where?' }));
    await user.type(screen.getByRole('combobox', { name: 'Where?' }), 'Tel Aviv');
    await user.click(screen.getByRole('button', { name: 'Search jobs' }));
    expect(screen.getByTestId('route')).toHaveTextContent('/jobs?search=Engineer&city=Tel+Aviv');
  });
  it('paginates the directory and preserves its query state in profile links', async () => {
    const user = userEvent.setup();
    const companies = Array.from({ length: 27 }, (_, index) => ({ ...catalog.companies[0], name: `Team ${String(index).padStart(2, '0')}` }));
    mocks.useJobsCatalog.mockReturnValue({ data: { ...catalog, companies }, isLoading: false, isError: false });
    renderPage(<Companies />, '/companies?category=software&sort=name');
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(24);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3);
    expect(screen.getByTestId('route')).toHaveTextContent('category=software&sort=name&page=2');
    expect(screen.getByRole('link', { name: /Team 24/ })).toHaveAttribute('href', '/company?name=Team%2024');
    await user.selectOptions(screen.getByLabelText('Hiring for'), 'design');
    expect(screen.getByText('No companies found')).toBeInTheDocument();
    expect(screen.getByTestId('route')).not.toHaveTextContent('page=2');
  });
  it('offers a recoverable map failure while keeping the location list available', async () => {
    const user = userEvent.setup(); renderPage(<MapPage />);
    await user.click(screen.getByRole('tab', { name: 'Map' }));
    act(() => mocks.tileLayer.mock.calls.at(-1)![0].eventHandlers.tileerror());
    expect(screen.getByText('The map is temporarily unavailable')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry map' }));
    expect(screen.queryByText('The map is temporarily unavailable')).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'List' }));
    expect(screen.getByRole('link', { name: /Tel Aviv.*12 jobs/ })).toBeInTheDocument();
    expect(mocks.tileLayer.mock.calls.at(-1)![0].referrerPolicy).toBe('strict-origin');
  });
  it('provides a searchable city list linking to filtered jobs', async () => {
    const user = userEvent.setup(); renderPage(<MapPage />);
    expect(screen.getByRole('link', { name: /Tel Aviv.*12 jobs/ })).toHaveAttribute('href', '/jobs?city=Tel%20Aviv');
    await user.type(screen.getByRole('searchbox', { name: 'Search cities in English or Hebrew' }), 'תל אביב');
    expect(screen.getByRole('link', { name: /Tel Aviv.*12 jobs/ })).toBeInTheDocument();
    expect(mocks.fitBounds).toHaveBeenCalled();
  });
});
