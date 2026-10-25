import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Globe, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CATEGORY_LABELS } from '@/components/jobs/jobsData';
import JobResults from '@/components/jobs/JobResults';
import CompanyLogo from '@/components/CompanyLogo';
import { useJobs, useJobsCatalog } from '@/hooks/useJobs';
import { useAuth } from '@/hooks/useAuth';
import { createPageUrl } from '@/utils';

export default function CompanyProfile() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const auth = useAuth();
  const name = params.get('name')?.trim() || '';
  const search = params.get('search') || '';
  const rawPage = params.get('page') || '1';
  const parsedPage = /^\d+$/.test(rawPage) && Number.isSafeInteger(Number(rawPage)) && Number(rawPage) > 0 ? Number(rawPage) : 1;
  const page = auth.isLoading || auth.isAuthenticated ? parsedPage : 1;
  const [input, setInput] = useState({ key: location.key, value: search });
  // Reset drafts when navigating, including when returning to a history entry.
  if (input.key !== location.key) setInput({ key: location.key, value: search });
  const searchQuery = input.key === location.key ? input.value : search;
  const setSearchQuery = (value: string) => setInput({ key: location.key, value });
  const catalog = useJobsCatalog();
  const company = catalog.data?.companies.find(item => item.name === name);
  const jobs = useJobs({ company: name, search, page }, Boolean(name));
  const update = (nextSearch: string, nextPage = 1, replace = false) => {
    const next = new URLSearchParams();
    next.set('name', name);
    if (nextSearch.trim()) next.set('search', nextSearch.trim());
    if (nextPage > 1) next.set('page', String(nextPage));
    setParams(next, { replace, preventScrollReset: true });
  };
  useEffect(() => {
    if (searchQuery === search) return;
    const timer = setTimeout(() => update(searchQuery), 250);
    return () => clearTimeout(timer);
    // update uses only the URL values already listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, search, name, setParams]);
  useEffect(() => {
    if (page !== parsedPage || (params.has('page') && parsedPage === 1)) update(search, page, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, parsedPage, search]);
  const cityLabels = catalog.data?.cityLabels || {};
  if (!name) return <div className="min-h-[60vh] bg-warm-50 px-4 py-20 text-center"><h1 className="mb-5 text-xl font-semibold text-warm-900">Company not found</h1><Button asChild><Link to={createPageUrl('Companies')}>Back to companies</Link></Button></div>;
  return <div className="min-h-screen bg-warm-50">
    <header className="border-b border-warm-200 bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <Link to={createPageUrl('Companies')} className="mb-5 inline-flex min-h-8 items-center gap-2 text-sm text-warm-500 hover:text-iris-700"><ArrowLeft className="h-4 w-4" aria-hidden="true" />All companies</Link>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 items-start gap-4"><CompanyLogo name={name} className="h-14 w-14 shrink-0 border border-warm-200" textSize="text-xl" /><div><h1 className="text-2xl font-bold text-warm-900 sm:text-3xl">{name}</h1><p className="mt-1 text-sm text-warm-500">{catalog.isLoading ? 'Loading company…' : company ? `${company.jobCount.toLocaleString()} open positions` : 'Explore opportunities with this team'}</p>{company && <div className="mt-2 flex flex-wrap gap-1.5">{company.jobCategories.slice(0, 5).map(category => <span key={category} className="rounded-md bg-iris-50 px-2 py-1 text-xs text-iris-700">{CATEGORY_LABELS[category] || category.replace(/-/g, ' ')}</span>)}</div>}</div></div>
          <Button asChild variant="outline" size="sm" className="gap-2"><a href={`https://www.google.com/search?q=${encodeURIComponent(`${name} Israel careers website`)}`} target="_blank" rel="noopener noreferrer"><Globe className="h-4 w-4" aria-hidden="true" />Find company website</a></Button>
        </div>
        {!!company?.locations.length && <p className="mt-4 flex items-start gap-2 text-sm text-warm-500"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>{company.locations.map(city => cityLabels[city] || city).join(' · ')}</span></p>}
      </div>
    </header>
    <section aria-label="Company jobs" className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-lg font-semibold text-warm-900">Open positions</h2><p role="status" className="mt-1 text-xs text-warm-500">{jobs.isLoading ? 'Loading jobs…' : `Showing ${jobs.data?.jobs.length || 0} of ${(jobs.data?.total || 0).toLocaleString()} matching jobs`}</p></div><div className="relative w-full sm:w-80"><Search className="absolute left-3 top-3 h-4 w-4 text-warm-400" aria-hidden="true" /><Input type="search" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search this company's jobs" aria-label="Search this company's jobs" className="h-11 bg-surface pl-9" /></div></div>
      {catalog.isError && <div role="status" className="mb-4 flex items-center justify-between rounded-lg bg-warning-bg px-4 py-3 text-sm text-warning"><span>Company details could not be refreshed.</span><button type="button" onClick={() => catalog.refetch()} className="underline">Retry</button></div>}
      <JobResults data={jobs.data} isLoading={jobs.isLoading} isError={jobs.isError} refetch={jobs.refetch} page={page} setPage={next => update(search, next)} onClear={() => update('')} />
    </section>
  </div>;
}
