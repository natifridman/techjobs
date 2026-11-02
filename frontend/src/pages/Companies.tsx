import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowRight, Building2, ChevronLeft, ChevronRight, MapPin, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import CompanyLogo from '@/components/CompanyLogo';
import CatalogFreshness from '@/components/CatalogFreshness';
import AddCompanyModal from '@/components/AddCompanyModal';
import { useJobsCatalog } from '@/hooks/useJobs';
import { CATEGORY_LABELS } from '@/components/jobs/jobsData';
import { locationLabel } from '@/lib/locations';

const PAGE_SIZE = 24;
export default function Companies() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const [suggesting, setSuggesting] = useState(false);
  const resultsRef = useRef<HTMLParagraphElement>(null);
  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const city = params.get('city') || '';
  const sort = params.get('sort') === 'name' ? 'name' : 'jobs';
  const { data, isLoading, isError, refetch } = useJobsCatalog();
  const companies = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return (data?.companies || [])
      .filter(
        (company) =>
          (!category || company.jobCategories.includes(category)) &&
          (!city || company.locations.includes(city)) &&
          (!query ||
            [
              company.name,
              ...company.categories,
              ...company.jobCategories.map((role) => CATEGORY_LABELS[role] || role),
              ...company.locations.flatMap((value) => [value, data?.cityLabels[value] || '']),
            ].some((value) => value.toLocaleLowerCase().includes(query))),
      )
      .sort((a, b) =>
        sort === 'name'
          ? a.name.localeCompare(b.name)
          : b.jobCount - a.jobCount || a.name.localeCompare(b.name),
      );
  }, [data, search, category, city, sort]);
  const pages = Math.max(1, Math.ceil(companies.length / PAGE_SIZE));
  const requestedPage = Number(params.get('page') || 1);
  const page = Math.min(pages, Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1);
  useEffect(() => {
    if (isLoading || !data || !params.has('page') || params.get('page') === String(page)) return;
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (page === 1) next.delete('page');
        else next.set('page', String(page));
        return next;
      },
      { replace: true },
    );
  }, [data, isLoading, page, params, setParams]);
  const change = (key: string, value: string, replace = false) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== 'page') next.delete('page');
        return next;
      },
      { replace },
    );
  const clear = () => setParams(sort === 'name' ? { sort: 'name' } : {});
  const movePage = (next: number) => {
    change('page', next > 1 ? String(next) : '');
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView?.({ block: 'start' });
      resultsRef.current?.focus({ preventScroll: true });
    });
  };
  const directoryUrl = location.pathname + location.search;
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="section-heading">
        <div>
          <p className="eyebrow mb-2">Find your people</p>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Hiring companies</h1>
          <p className="mt-2 text-muted">Explore the teams building what comes next.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setSuggesting(true)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Suggest a company
          </Button>
          <Button asChild>
            <Link to="/jobs">
              Browse jobs
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
      <div className="mt-7 rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="relative">
          <label htmlFor="company-search" className="sr-only">
            Search companies, roles or locations
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-muted"
            aria-hidden="true"
          />
          <Input
            id="company-search"
            type="search"
            value={search}
            onChange={(event) => change('search', event.target.value, true)}
            placeholder="Search companies, roles or locations"
            className="h-12 bg-page pl-10 text-base"
          />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="companies-role" className="mb-1.5 block text-xs font-semibold text-muted">
              Hiring for
            </label>
            <select
              id="companies-role"
              className="native-select"
              value={category}
              onChange={(event) => change('category', event.target.value)}
            >
              <option value="">All roles</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="companies-city" className="mb-1.5 block text-xs font-semibold text-muted">
              Location
            </label>
            <select
              id="companies-city"
              className="native-select"
              value={city}
              onChange={(event) => change('city', event.target.value)}
            >
              <option value="">All locations</option>
              {data?.facets.cities.map((value) => (
                <option key={value} value={value}>
                  {locationLabel(value, data.cityLabels)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="companies-sort" className="mb-1.5 block text-xs font-semibold text-muted">
              Sort by
            </label>
            <select
              id="companies-sort"
              className="native-select"
              value={sort}
              onChange={(event) => change('sort', event.target.value === 'jobs' ? '' : 'name')}
            >
              <option value="jobs">Most openings</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
      </div>
      {data && <CatalogFreshness updatedAt={data.updatedAt} stale={data.stale || isError} className="mt-3" />}
      {isError && data && (
        <div
          className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning-border bg-warning-bg p-4 text-sm text-warning"
          role="status"
        >
          Could not refresh companies. Showing the last loaded catalog.
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}
      {isLoading ? (
        <div
          role="status"
          aria-label="Loading companies"
          className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-52 animate-pulse rounded-2xl border border-border bg-warm-100" />
          ))}
        </div>
      ) : isError && !data ? (
        <div className="py-16 text-center" role="alert">
          <Building2 className="mx-auto h-10 w-10 text-muted" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold">Companies could not be loaded</h2>
          <p className="mb-5 mt-2 text-muted">Please check your connection and try again.</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      ) : (
        <>
          <div className="mb-4 mt-6 flex flex-wrap items-center justify-between gap-2">
            <p ref={resultsRef} tabIndex={-1} className="scroll-mt-24 text-sm text-muted" role="status">
              {companies.length.toLocaleString()} {companies.length === 1 ? 'company' : 'companies'} with open
              jobs{search.trim() && ` matching “${search.trim()}”`}
              {companies.length > PAGE_SIZE && ` · Page ${page} of ${pages}`}
            </p>
            {(search || category || city) && (
              <Button variant="ghost" size="sm" onClick={clear}>
                Clear filters
              </Button>
            )}
          </div>
          {companies.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-10 text-center">
              <h2 className="font-semibold text-ink">No companies found</h2>
              <p className="mb-4 mt-2 text-sm text-muted">Try another company name, role or location.</p>
              <Button variant="outline" onClick={clear}>
                Clear search and filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {companies.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((company) => (
                <Link
                  key={company.name}
                  state={{ directoryUrl }}
                  to={`/company?name=${encodeURIComponent(company.name)}`}
                  className="discovery-card group flex min-w-0 flex-col p-5"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <CompanyLogo name={company.name} className="h-12 w-12" />
                    <Badge className="font-medium">
                      {company.jobCount.toLocaleString()} {company.jobCount === 1 ? 'job' : 'jobs'}
                    </Badge>
                  </div>
                  <h2 className="break-words text-lg font-semibold text-ink group-hover:text-primary">
                    <bdi>{company.name}</bdi>
                  </h2>
                  <div className="mb-5 mt-2 flex items-start gap-2 text-sm text-muted">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <div>
                      {company.locations.length
                        ? company.locations.slice(0, 2).map((value, index) => (
                            <span key={value}>
                              {index > 0 && ' · '}
                              <bdi>{locationLabel(value, data?.cityLabels)}</bdi>
                            </span>
                          ))
                        : 'Location not specified'}
                      {company.locations.length > 2 && ` +${company.locations.length - 2} locations`}
                    </div>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-1.5" aria-label="Hiring roles">
                    {company.jobCategories.slice(0, 3).map((role) => (
                      <Badge key={role} variant="secondary" className="font-normal">
                        {CATEGORY_LABELS[role] || role.replace(/-/g, ' ')}
                      </Badge>
                    ))}
                    {company.jobCategories.length > 3 && (
                      <Badge variant="secondary" className="font-normal">
                        +{company.jobCategories.length - 3} roles
                      </Badge>
                    )}
                  </div>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
                    Explore company
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          )}
          {pages > 1 && (
            <nav
              aria-label="Company directory pages"
              className="mt-7 flex flex-wrap items-center justify-center gap-4"
            >
              <Button variant="outline" disabled={page <= 1} onClick={() => movePage(page - 1)}>
                <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
                Previous
              </Button>
              <span className="text-sm text-muted">
                Page {page} of {pages}
              </span>
              <Button variant="outline" disabled={page >= pages} onClick={() => movePage(page + 1)}>
                Next
                <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
              </Button>
            </nav>
          )}
        </>
      )}
      <AddCompanyModal open={suggesting} onOpenChange={setSuggesting} />
    </div>
  );
}
