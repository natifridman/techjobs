import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import CompanyLogo from '@/components/CompanyLogo';
import CatalogFreshness from '@/components/CatalogFreshness';
import { useJobsCatalog } from '@/hooks/useJobs';
import { CATEGORY_LABELS } from '@/components/jobs/jobsData';

export default function Companies() {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, refetch } = useJobsCatalog();
  const companies = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return (data?.companies || []).filter(company => !query || [company.name, ...company.categories, ...company.jobCategories.map(role => CATEGORY_LABELS[role] || role), ...company.locations.flatMap(city => [city, data?.cityLabels[city] || ''])].some(value => value.toLocaleLowerCase().includes(query)));
  }, [data, search]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><h1 className="text-3xl font-bold tracking-tight text-ink">Hiring companies</h1><p className="mt-2 text-muted">Explore tech employers and the roles they are hiring for.</p></div>
        <Button asChild variant="outline"><Link to="/jobs">Browse jobs<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link></Button>
      </div>
      <div className="relative mt-7 max-w-2xl"><label htmlFor="company-search" className="sr-only">Search companies, roles or locations</label><Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden="true" /><Input id="company-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search companies, roles or locations" className="h-12 pl-12 text-base" /></div>
      {data && <CatalogFreshness updatedAt={data.updatedAt} stale={data.stale || isError} className="mt-3" />}
      {isError && data && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning-border bg-warning-bg p-4 text-sm text-warning" role="status">Could not refresh companies. Showing the last loaded catalog.<Button variant="outline" onClick={() => refetch()}>Retry</Button></div>}
      {isLoading ? <div role="status" aria-label="Loading companies" className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-52 animate-pulse rounded-xl border border-border bg-warm-100" />)}</div> : isError && !data ? <div className="py-16 text-center" role="alert"><Building2 className="mx-auto h-10 w-10 text-muted" aria-hidden="true" /><h2 className="mt-4 text-lg font-semibold">Companies could not be loaded</h2><p className="mb-5 mt-2 text-muted">Please check your connection and try again.</p><Button onClick={() => refetch()}>Retry</Button></div> : <>
        <p className="mb-4 mt-7 text-sm text-muted" role="status">{companies.length.toLocaleString()} {companies.length === 1 ? 'company' : 'companies'} with open jobs{search.trim() && ` matching “${search.trim()}”`}</p>
        {companies.length === 0 ? <div className="rounded-xl border border-border bg-surface p-10 text-center"><h2 className="font-semibold text-ink">No companies found</h2><p className="mb-4 mt-2 text-sm text-muted">Try a company name, role or another location.</p>{search && <Button variant="outline" onClick={() => setSearch('')}>Clear search</Button>}</div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map(company => <Link key={company.name} to={`/company?name=${encodeURIComponent(company.name)}`} className="group flex flex-col rounded-xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-iris-300">
            <div className="mb-4 flex items-start justify-between gap-3"><CompanyLogo name={company.name} className="h-12 w-12" /><Badge className="font-medium">{company.jobCount.toLocaleString()} {company.jobCount === 1 ? 'job' : 'jobs'}</Badge></div>
            <h2 className="text-lg font-semibold text-ink group-hover:text-primary"><bdi>{company.name}</bdi></h2>
            <div className="mb-5 mt-2 flex items-start gap-2 text-sm text-muted"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><div>{company.locations.length ? company.locations.slice(0, 3).map((city, index) => <span key={city}>{index > 0 && ' · '}<bdi dir="auto">{data?.cityLabels[city] || city}</bdi></span>) : 'Location not specified'}{company.locations.length > 3 && ` +${company.locations.length - 3}`}</div></div>
            <div className="mt-auto flex flex-wrap gap-1.5" aria-label="Hiring roles">{company.jobCategories.slice(0, 3).map(role => <Badge key={role} variant="secondary" className="font-normal">{CATEGORY_LABELS[role] || role.replace(/-/g, ' ')}</Badge>)}{company.jobCategories.length > 3 && <Badge variant="secondary" className="font-normal">+{company.jobCategories.length - 3} roles</Badge>}</div>
          </Link>)}
        </div>}
      </>}
    </div>
  );
}
