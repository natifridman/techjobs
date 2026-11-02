import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Briefcase, Building2, Code2, Coins, Cpu, MapPin, Plus, Rocket, Search, Server, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useJobsCatalog } from '@/hooks/useJobs';
import AddCompanyModal from '@/components/AddCompanyModal';
import CatalogFreshness from '@/components/CatalogFreshness';

const roles = [
  { name: 'Software', slug: 'software', icon: Code2 },
  { name: 'Data & AI', slug: 'data-ai', icon: Cpu },
  { name: 'Security', slug: 'security', icon: Shield },
  { name: 'DevOps & Infrastructure', slug: 'devops', icon: Server },
  { name: 'Product', slug: 'product', icon: Rocket },
  { name: 'Finance', slug: 'finance', icon: Coins },
];

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showAddCompany, setShowAddCompany] = useState(false);
  const { data, isLoading, isError, refetch } = useJobsCatalog();
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    navigate(`/jobs${params.size ? `?${params}` : ''}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:pt-14">
      <section className="max-w-3xl" aria-labelledby="home-title">
        <p className="mb-3 text-sm font-semibold text-primary">Your next opportunity, closer.</p>
        <h1 id="home-title" className="text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">Find your place in Israeli tech.</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">Explore roles at startups and established tech companies across Israel. Search by title, skill or company.</p>
        <form onSubmit={submitSearch} role="search" aria-label="Search jobs" className="mt-7 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <label htmlFor="home-search" className="sr-only">Job title, skill or company</label>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden="true" />
            <Input id="home-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Job title, skill or company" className="h-12 pl-12 text-base" />
          </div>
          <Button type="submit" size="lg">Search jobs<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>
        </form>
        <div className="mt-3 flex flex-wrap gap-x-6">
          <Link to="/jobs" className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">Browse all jobs</Link>
          <Link to="/map" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted hover:text-primary"><MapPin className="h-4 w-4" aria-hidden="true" />Explore by location</Link>
        </div>
      </section>

      <section className="my-9 rounded-xl border border-border bg-surface px-5 py-5 sm:px-7" aria-label="Current catalog">
        {isError && !data ? (
          <div className="flex flex-wrap items-center justify-between gap-3" role="status"><p className="text-sm text-muted">Catalog counts are temporarily unavailable. You can still open job search.</p><Button variant="outline" onClick={() => refetch()}>Retry</Button></div>
        ) : (
          <>
            <dl className="grid grid-cols-3 gap-3 sm:gap-8">
              {[{ key: 'jobs' as const, label: 'Open jobs', icon: Briefcase }, { key: 'companies' as const, label: 'Hiring companies', icon: Building2 }, { key: 'cities' as const, label: 'Cities', icon: MapPin }].map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center gap-3">
                  <Icon className="hidden h-5 w-5 text-primary sm:block" aria-hidden="true" />
                  <div><dt className="text-xs text-muted sm:text-sm">{label}</dt><dd className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{data ? data.stats[key].toLocaleString() : <span aria-label="Loading count">—</span>}</dd></div>
                </div>
              ))}
            </dl>
            {!isLoading && <CatalogFreshness updatedAt={data?.updatedAt} stale={data?.stale || isError} className="mt-4 border-t border-border pt-3" />}
          </>
        )}
      </section>

      <section aria-labelledby="role-title">
        <h2 id="role-title" className="text-2xl font-semibold tracking-tight text-ink">Browse by role</h2>
        <p className="mt-2 text-muted">Start with the work you want to do.</p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map(({ name, slug, icon: Icon }) => (
            <Link key={slug} to={`/jobs?category=${slug}`} className="group flex min-h-24 items-center gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-iris-300">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-iris-50 text-primary"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <span className="flex-1 font-medium text-ink">{name}</span><ArrowRight className="h-4 w-4 text-muted group-hover:text-primary" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-9 flex flex-col gap-5 rounded-xl border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="company-title">
        <div><h2 id="company-title" className="text-lg font-semibold text-ink">Find a company that fits.</h2><p className="mt-1 text-sm text-muted">Explore employers, their locations and current roles.</p></div>
        <div className="flex flex-wrap items-center gap-3"><Button asChild variant="outline"><Link to="/companies">Explore companies</Link></Button><Button variant="ghost" onClick={() => setShowAddCompany(true)}><Plus className="mr-2 h-4 w-4" aria-hidden="true" />Suggest a company</Button></div>
      </section>
      <AddCompanyModal open={showAddCompany} onOpenChange={setShowAddCompany} />
    </div>
  );
}
