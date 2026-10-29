import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import FilterSidebar from '@/components/jobs/FilterSidebar';
import { type ListFilter } from '@/components/jobs/filters';
import SearchHeader from '@/components/jobs/SearchHeader';
import JobResults from '@/components/jobs/JobResults';
import { downloadCsvBlob } from '@/components/jobs/exportCsv';
import { jobsContinuationUrl } from '@/components/jobs/jobsNavigation';
import { CATEGORY_LABELS, REGION_LABELS } from '@/components/jobs/jobsData';
import { useJobs, useJobsCatalog } from '@/hooks/useJobs';
import { useJobsFilters } from '@/hooks/useJobsFilters';
import { useAuth } from '@/hooks/useAuth';
import { revokeJobAccess } from '@/hooks/authCache';
import { exportJobsCsv, JobsApiError } from '@/api/jobs';
import { createPageUrl } from '@/utils';

const EMPTY_CITY_LABELS: Record<string, string> = {};

export default function Jobs() {
  const auth = useAuth();
  const client = useQueryClient();
  const catalog = useJobsCatalog();
  const cityLabels = catalog.data?.cityLabels || EMPTY_CITY_LABELS;
  const cities = useMemo(() => catalog.data?.facets.cities
    .slice().sort((a, b) => (cityLabels[a] || a).localeCompare(cityLabels[b] || b)), [catalog.data, cityLabels]);
  const state = useJobsFilters(cities, auth.isLoading || auth.isAuthenticated);
  const jobs = useJobs(state.query, catalog.isSuccess || catalog.isError);
  const [filterOpen, setFilterOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const guest = jobs.data ? jobs.data.access === 'guest' : !auth.isAuthenticated;
  const clear = state.clearAll;
  const chips: { label: string; remove: () => void }[] = [];
  for (const key of ['jobCategories', 'workModels', 'employmentTypes', 'seniorities', 'cities', 'regions'] as ListFilter[]) {
    for (const value of state.filters[key]) {
      const label = key === 'jobCategories' ? CATEGORY_LABELS[value] : key === 'cities' ? cityLabels[value] || value
        : key === 'regions' ? REGION_LABELS[value] : value.replace(/-/g, ' ');
      chips.push({ label, remove: () => state.setFilters(previous => ({ ...previous, [key]: previous[key].filter(item => item !== value) })) });
    }
  }
  if (state.filters.showClosed) chips.push({ label: 'Including closed jobs', remove: () => state.setFilters(previous => ({ ...previous, showClosed: false })) });
  if (state.company) chips.push({ label: state.company, remove: () => state.setCompany('') });
  const exportCsv = async () => {
    if (guest) { auth.login(jobsContinuationUrl()); return; }
    setExporting(true);
    try { downloadCsvBlob(await exportJobsCsv(state.query)); }
    catch (error) {
      if (error instanceof JobsApiError && error.status === 401) { revokeJobAccess(client); auth.login(jobsContinuationUrl()); }
      else toast.error('Could not export jobs. Please try again.');
    } finally { setExporting(false); }
  };
  return <div className="min-h-screen bg-warm-50">
    <header className="border-b border-warm-200 bg-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-3.5">
        <div><p className="mb-1 text-xs font-medium uppercase tracking-wider text-iris-700">Find your next role</p><h1 className="text-2xl font-bold tracking-tight text-warm-900 sm:text-3xl">Israeli tech jobs</h1><p className="mt-1 text-sm text-warm-500">Fresh opportunities from startups and established teams.</p></div>
        <Button asChild variant="outline" className="hidden gap-2 sm:flex"><Link to={createPageUrl('Companies')}><Building2 className="h-4 w-4" aria-hidden="true" />Companies</Link></Button>
      </div>
    </header>
    <SearchHeader searchQuery={state.searchQuery} setSearchQuery={state.setSearchQuery} onFilterClick={() => setFilterOpen(true)} totalJobs={jobs.data?.total || 0} visibleJobs={jobs.data?.jobs.length || 0} activeFiltersCount={chips.length} isLoading={jobs.isLoading || catalog.isLoading} isGuest={guest} onExportCsv={exportCsv} isExporting={exporting} />
    <div className="mx-auto flex max-w-7xl items-start gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <FilterSidebar filters={state.filters} setFilters={state.setFilters} cities={cities || []} cityLabels={cityLabels} isOpen={filterOpen} onClose={() => setFilterOpen(false)} isMobile />
      <FilterSidebar filters={state.filters} setFilters={state.setFilters} cities={cities || []} cityLabels={cityLabels} isOpen onClose={() => {}} isMobile={false} />
      <section className="min-w-0 flex-1" aria-label="Matching jobs">
        {(chips.length > 0 || state.filters.search) && <div className="mb-4 flex flex-wrap items-center gap-2" aria-label="Selected filters">
          {state.filters.search && <button type="button" onClick={() => state.setFilters(previous => ({ ...previous, search: '' }))} className="inline-flex min-h-11 sm:min-h-8 items-center gap-1.5 rounded-full border border-iris-200 bg-iris-50 px-3 text-xs text-iris-700" aria-label={`Remove search: ${state.filters.search}`}><span>“{state.filters.search}”</span><X className="h-3 w-3" aria-hidden="true" /></button>}
          {chips.map(chip => <button key={chip.label} type="button" onClick={chip.remove} className="inline-flex min-h-11 sm:min-h-8 items-center gap-1.5 rounded-full border border-iris-200 bg-iris-50 px-3 text-xs capitalize text-iris-700" aria-label={`Remove filter: ${chip.label}`}>{chip.label}<X className="h-3 w-3" aria-hidden="true" /></button>)}
          <Button variant="ghost" size="sm" className="text-xs text-warm-500" onClick={clear} aria-label="Clear all filters">Clear all</Button>
        </div>}
        <JobResults data={jobs.data} isLoading={jobs.isLoading || catalog.isLoading} isError={jobs.isError} refetch={jobs.refetch} page={state.page} setPage={state.setPage} onClear={clear} />
      </section>
    </div>
  </div>;
}
