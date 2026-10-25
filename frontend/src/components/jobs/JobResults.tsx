import { useEffect, useRef } from 'react';
import { usePostHog } from 'posthog-js/react';
import { useLocation } from 'react-router-dom';
import { Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import type { JobsResponse } from '@/api/jobs';
import { useJobActions } from '@/hooks/useJobActions';
import { Button } from '@/components/ui/button';
import JobCard from './JobCard';
import JobsLoader from './JobsLoader';
import PreviewGate from './PreviewGate';

interface JobResultsProps {
  data?: JobsResponse;
  isLoading: boolean;
  isError: boolean;
  refetch: () => unknown;
  page: number;
  setPage: (page: number) => void;
  onClear?: () => void;
}

export default function JobResults({ data, isLoading, isError, refetch, page, setPage, onClear }: JobResultsProps) {
  const actions = useJobActions();
  const posthog = usePostHog();
  const continued = useRef(false);
  const scrollBehavior = (): ScrollBehavior => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  const location = useLocation();
  const guest = data?.access === 'guest';
  const jobs = guest ? data.jobs.slice(0, data.previewLimit ?? 10) : data?.jobs ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const showGate = guest && data.total > (data.previewLimit ?? 10);

  useEffect(() => {
    if (data && !guest && page > totalPages) setPage(totalPages);
  }, [data, guest, page, totalPages, setPage]);

  useEffect(() => {
    if (data?.access !== 'authenticated' || location.hash !== '#continue-jobs' || isLoading || continued.current) return;
    const timer = setTimeout(() => {
      document.getElementById('continue-jobs')?.scrollIntoView?.({ block: 'start', behavior: scrollBehavior() });
      posthog.capture('jobs_preview_continued', { matching_jobs: data.total });
      continued.current = true;
    }, 50);
    return () => clearTimeout(timer);
  }, [data, location.hash, isLoading, posthog]);

  const changePage = (next: number) => { setPage(next); window.scrollTo({ top: 0, behavior: scrollBehavior() }); };
  const visiblePages = [...new Set([1, page - 1, page, page + 1, totalPages])]
    .filter(value => value >= 1 && value <= totalPages).sort((a, b) => a - b);
  return <div aria-busy={isLoading}>
    {(data?.stale || (isError && jobs.length > 0)) && <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"><span>Showing the last available jobs. The latest refresh is delayed.</span><button type="button" onClick={() => refetch()} className="min-h-8 underline">Retry</button></div>}
    {isLoading ? <JobsLoader /> : isError && jobs.length === 0 ? <div role="alert" className="rounded-xl border border-warm-200 bg-white px-5 py-14 text-center"><Briefcase className="mx-auto mb-3 h-9 w-9 text-warm-300" aria-hidden="true" /><h2 className="text-lg font-semibold text-warm-800">Jobs could not be loaded</h2><p className="mt-2 mb-5 text-sm text-warm-500">Check your connection and try again.</p><Button onClick={() => refetch()}>Retry</Button></div>
      : jobs.length === 0 ? <div className="rounded-xl border border-dashed border-warm-200 bg-white px-5 py-14 text-center"><Briefcase className="mx-auto mb-3 h-9 w-9 text-warm-300" aria-hidden="true" /><h2 className="text-lg font-semibold text-warm-800">No jobs found</h2><p className="mt-2 text-sm text-warm-500">Try a different keyword or adjust your filters.</p>{onClear && <Button variant="link" onClick={onClear} className="mt-2 text-iris-700">Clear all filters</Button>}</div>
        : <>
          <div className="space-y-3">{jobs.map((job, index) => <div key={`${job.url}-${index}`} id={index === 10 ? 'continue-jobs' : undefined} className="scroll-mt-52"><JobCard job={job} onSave={actions.saveJob} isSaved={actions.isSaved(job)} onApply={actions.markApplied} isApplied={actions.isApplied(job)} /></div>)}{showGate && <PreviewGate total={data.total} />}</div>
          {!guest && totalPages > 1 && <nav aria-label="Job results pages" className="mt-6 flex flex-wrap items-center justify-center gap-2"><Button variant="outline" size="sm" onClick={() => changePage(page - 1)} disabled={page <= 1} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>{visiblePages.map((number, index) => <span className="flex items-center gap-2" key={number}>{index > 0 && number - visiblePages[index - 1] > 1 && <span className="text-warm-400">…</span>}<Button size="sm" variant={page === number ? 'default' : 'outline'} aria-label={`Page ${number}`} aria-current={page === number ? 'page' : undefined} onClick={() => changePage(number)}>{number}</Button></span>)}<Button variant="outline" size="sm" onClick={() => changePage(page + 1)} disabled={page >= totalPages} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button></nav>}
        </>}
  </div>;
}
