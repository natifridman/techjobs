import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bookmark,
  Briefcase,
  Building2,
  Code2,
  CircuitBoard,
  Cpu,
  ExternalLink,
  MapPin,
  Server,
  Shield,
  Sparkles,
  Search,
  UsersRound,
  Wrench,
  Handshake,
} from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useJobsCatalog } from '@/hooks/useJobs';
import JobSearchInput from '@/components/jobs/JobSearchInput';
import CompanyLogo from '@/components/CompanyLogo';
import CatalogFreshness from '@/components/CatalogFreshness';
import HomeJobPreview from '@/components/home/HomeJobPreview';
import { CATEGORY_LABELS } from '@/components/jobs/jobsData';
import { locationLabel } from '@/lib/locations';

const roleIcons = {
  software: Code2,
  'data-ai': Cpu,
  security: Shield,
  devops: Server,
  'hardware-electronics': CircuitBoard,
  management: UsersRound,
  'mechanical-manufacturing': Wrench,
  sales: Handshake,
};
const shortcuts = [
  { label: 'Software', href: '/jobs?category=software' },
  { label: 'Data & AI', href: '/jobs?category=data-ai' },
  { label: 'Remote', href: '/jobs?workModel=remote' },
];

export default function Home() {
  const navigate = useNavigate();
  const posthog = usePostHog();
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [locationError, setLocationError] = useState('');
  const { data, isLoading, isError, refetch } = useJobsCatalog();
  const roles = Object.entries(data?.categoryCounts || {})
    .filter(([slug, count]) => slug !== 'other' && count > 0 && Object.hasOwn(CATEGORY_LABELS, slug))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6);
  const employers = [...(data?.companies || [])]
    .sort((a, b) => b.jobCount - a.jobCount || a.name.localeCompare(b.name))
    .slice(0, 6);
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (location.trim()) {
      const needle = location.trim().toLocaleLowerCase();
      const cities = data?.facets.cities || [];
      const exact = cities.find((city) =>
        [city, data?.cityLabels[city], locationLabel(city, data?.cityLabels)].some(
          (label) => label?.toLocaleLowerCase() === needle,
        ),
      );
      if (!exact) {
        setLocationError('Choose a location from the suggestions, or leave this field empty.');
        return;
      }
      params.set('city', exact);
    }
    posthog.capture('home_search_submitted', {
      has_keyword: !!search.trim(),
      has_location: !!location.trim(),
    });
    navigate(`/jobs${params.size ? `?${params}` : ''}`);
  };
  return (
    <>
      <section className="home-hero" aria-labelledby="home-title">
        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-9 sm:px-6 sm:pb-12 sm:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow mx-auto mb-4 w-fit rounded-full border border-iris-200 bg-surface/80 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Your next opportunity, closer.
            </p>
            <h1
              id="home-title"
              className="text-4xl font-bold leading-[1.12] tracking-tight text-ink sm:text-[3.5rem]"
            >
              Find your next role in <span className="whitespace-nowrap text-primary">Israeli tech.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted sm:text-lg">
              Discover open roles at startups and established teams across Israel.
            </p>
          </div>
          <form
            onSubmit={submitSearch}
            role="search"
            aria-label="Search jobs"
            className="hero-search mx-auto mt-6 max-w-4xl rounded-2xl border border-border bg-surface p-3 shadow-lg sm:mt-8 sm:flex sm:flex-wrap sm:items-end sm:gap-3 sm:p-4"
          >
            <div className="min-w-0 flex-1">
              <label htmlFor="home-search" className="mb-1.5 block text-left text-xs font-semibold text-ink">
                What are you looking for?
              </label>
              <JobSearchInput id="home-search" value={search} onChange={setSearch} label="Job title, skill or company" placeholder="Job title, skill or company" />
            </div>
            <div className="mt-3 min-w-0 sm:mt-0 sm:w-[30%]">
              <label
                htmlFor="home-location"
                className="mb-1.5 block text-left text-xs font-semibold text-ink"
              >
                Where?
              </label>
              <div className="relative">
                <MapPin
                  className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-muted"
                  aria-hidden="true"
                />
                <Input
                  id="home-location"
                  list="home-locations"
                  value={location}
                  onChange={(event) => {
                    setLocation(event.target.value);
                    setLocationError('');
                  }}
                  placeholder="Anywhere in Israel"
                  disabled={!data}
                  aria-invalid={!!locationError}
                  aria-describedby={locationError ? 'home-location-error' : undefined}
                  className="h-12 bg-page pl-10 text-base"
                />
                <datalist id="home-locations">
                  {data?.facets.cities.map((city) => (
                    <option value={city} key={city}>
                      {locationLabel(city, data.cityLabels)}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>
            <Button type="submit" size="lg" className="mt-3 w-full gap-2 sm:mt-0 sm:w-auto">
              Search jobs
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            {locationError && (
              <p id="home-location-error" role="alert" className="mt-2 text-sm text-danger sm:basis-full">
                {locationError}
              </p>
            )}
          </form>
          <div className="mx-auto mt-4 flex max-w-4xl flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm">
            <span className="text-muted">Try:</span>
            {shortcuts.map((shortcut) => (
              <Link
                key={shortcut.label}
                to={shortcut.href}
                onClick={() => posthog.capture('home_shortcut_clicked', { shortcut: shortcut.label })}
                className="inline-flex min-h-9 items-center rounded-full border border-border bg-surface/70 px-3 text-ink hover:border-primary hover:text-primary"
              >
                {shortcut.label}
              </Link>
            ))}
            <Link
              to="/jobs"
              className="ml-1 inline-flex min-h-9 items-center gap-1 font-medium text-primary hover:underline"
            >
              Browse all jobs
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          <p className="mt-3 text-center text-xs text-muted">
            Preview 10 jobs per search. Sign in to view all matches and sync your saves.
          </p>
          <section
            aria-label="Current catalog"
            className="mx-auto mt-7 max-w-2xl border-t border-border/70 pt-5"
          >
            {isError && !data ? (
              <div className="flex flex-wrap items-center justify-center gap-3 text-center" role="status">
                <p className="text-sm text-muted">
                  Catalog counts are temporarily unavailable. You can still open job search.
                </p>
                <Button variant="link" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            ) : (
              <>
                <dl className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { key: 'jobs' as const, label: 'Open jobs', icon: Briefcase },
                    { key: 'companies' as const, label: 'Hiring companies', icon: Building2 },
                    { key: 'cities' as const, label: 'Locations', icon: MapPin },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex flex-col">
                      <dt className="order-2 mt-0.5 text-xs text-muted sm:text-sm">{label}</dt>
                      <dd className="order-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">
                        {data ? data.stats[key].toLocaleString() : '—'}
                      </dd>
                    </div>
                  ))}
                </dl>
                {!isLoading && (
                  <CatalogFreshness
                    updatedAt={data?.updatedAt}
                    stale={data?.stale || isError}
                    className="mt-3 text-center"
                  />
                )}
              </>
            )}
          </section>
        </div>
      </section>
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:space-y-16 sm:px-6 sm:py-14">
        {!!employers.length && (
          <section aria-labelledby="hiring-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow mb-1">Good company for your next move</p>
                <h2 id="hiring-title">Explore hiring companies</h2>
              </div>
              <Link to="/companies" className="section-link">
                Explore all companies
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {employers.map((company) => (
                <Link
                  key={company.name}
                  to={`/company?name=${encodeURIComponent(company.name)}`}
                  onClick={() => posthog.capture('home_company_clicked', { company: company.name })}
                  className="discovery-card flex min-w-0 flex-col items-center gap-3 p-4 text-center"
                >
                  <CompanyLogo name={company.name} className="h-12 w-12" />
                  <span className="w-full break-words text-sm font-semibold text-ink">
                    <bdi>{company.name}</bdi>
                  </span>
                  <span className="mt-auto text-xs text-muted">
                    {company.jobCount.toLocaleString()} open {company.jobCount === 1 ? 'role' : 'roles'}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
        {!!roles.length && (
          <section aria-labelledby="role-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow mb-1">Find your focus</p>
                <h2 id="role-title">Browse by role</h2>
              </div>
              <Link to="/jobs" className="section-link">
                Browse all roles
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {roles.map(([slug, count]) => {
                const Icon = roleIcons[slug as keyof typeof roleIcons] || Briefcase;
                return (
                  <Link
                    key={slug}
                    to={`/jobs?category=${slug}`}
                    onClick={() => posthog.capture('home_role_clicked', { category: slug })}
                    className="discovery-card group flex items-center gap-4 p-5"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-iris-50 text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-ink">{CATEGORY_LABELS[slug]}</h3>
                      <p className="mt-1 text-sm text-muted">
                        {count.toLocaleString()} open {count === 1 ? 'role' : 'roles'}
                      </p>
                    </div>
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-muted group-hover:text-primary"
                      aria-hidden="true"
                    />
                  </Link>
                );
              })}
            </div>
          </section>
        )}
        <section aria-labelledby="preview-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow mb-1">Different teams. More possibilities.</p>
              <h2 id="preview-title">Explore open roles</h2>
            </div>
            <Link to="/jobs" className="section-link">
              View all jobs
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-5">
            <HomeJobPreview />
          </div>
        </section>
        {!!data?.cities.length && (
          <section aria-labelledby="locations-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow mb-1">Find opportunity nearby</p>
                <h2 id="locations-title">Browse by location</h2>
              </div>
              <Link to="/map" className="section-link">
                Explore the map
                <MapPin className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.cities.slice(0, 6).map((city) => (
                <Link
                  key={city.city}
                  to={`/jobs?city=${encodeURIComponent(city.city)}`}
                  onClick={() => posthog.capture('home_location_clicked', { city: city.city })}
                  className="discovery-card flex items-center gap-3 p-5"
                >
                  <MapPin className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <bdi className="block font-semibold text-ink">
                      {locationLabel(city.city, data.cityLabels)}
                    </bdi>
                    <span className="mt-1 block text-sm text-muted">
                      {city.jobCount.toLocaleString()} open roles
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        )}
        <section
          className="rounded-2xl border border-iris-200 bg-iris-50 p-6 sm:p-8"
          aria-labelledby="how-title"
        >
          <h2 id="how-title" className="text-xl font-semibold tracking-tight text-ink">
            A clearer path to your next chapter.
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            {[
              { icon: Search, title: 'Find your fit', text: 'Search by role, skill, company or location.' },
              {
                icon: Bookmark,
                title: 'Keep a shortlist',
                text: 'Save roles and notes here. Sign in to sync across devices.',
              },
              {
                icon: ExternalLink,
                title: 'Make your move',
                text: 'Apply directly on the employer’s website.',
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-3">
                <Icon className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-ink">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
