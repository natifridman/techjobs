import { useEffect, useRef } from 'react';
import JobSearchInput from './JobSearchInput';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, Bookmark, Download, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SearchHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onFilterClick: () => void;
  totalJobs: number;
  visibleJobs: number;
  activeFiltersCount: number;
  isLoading?: boolean;
  isGuest?: boolean;
  onExportCsv?: () => void;
  isExporting?: boolean;
  sort?: 'balanced' | 'recent';
  onSortChange?: (sort: 'balanced' | 'recent') => void;
  onSignIn?: () => void;
}
export default function SearchHeader({
  searchQuery,
  setSearchQuery,
  onFilterClick,
  totalJobs,
  visibleJobs,
  activeFiltersCount,
  isLoading,
  isGuest,
  onExportCsv,
  isExporting,
  sort = 'balanced',
  onSortChange,
  onSignIn,
}: SearchHeaderProps) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent | KeyboardEvent) => {
      if (!menuRef.current?.open) return;
      if (event instanceof KeyboardEvent && event.key === 'Escape') {
        menuRef.current.open = false;
        menuRef.current.querySelector('summary')?.focus();
      } else if (event.type === 'pointerdown' && !menuRef.current.contains(event.target as Node))
        menuRef.current.open = false;
    };
    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', close);
    return () => {
      document.removeEventListener('keydown', close);
      document.removeEventListener('pointerdown', close);
    };
  }, []);
  return (
    <div
      className="sticky z-20 border-b border-border bg-surface/95 backdrop-blur-md"
      style={{ top: 'var(--header-height)' }}
      role="search"
    >
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <label htmlFor="jobs-search" className="sr-only">
              Search jobs, companies, or keywords
            </label>
            <JobSearchInput id="jobs-search" value={searchQuery} onChange={setSearchQuery} label="Search jobs, companies, or keywords" placeholder="Job title, company, or keyword" className="h-11" />
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              data-job-filter-trigger
              variant="outline"
              onClick={onFilterClick}
              className="gap-1.5 px-2 text-xs sm:px-3 sm:text-sm lg:hidden"
              aria-label={`Open filters${activeFiltersCount ? ` (${activeFiltersCount} active)` : ''}`}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Filters
              {!!activeFiltersCount && (
                <span className="rounded-full bg-action px-1.5 py-0.5 text-xs text-action-foreground">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
            <div className="min-w-0 flex-1 sm:flex-none">
              <label htmlFor="jobs-sort" className="sr-only">
                Sort jobs
              </label>
              <select
                id="jobs-sort"
                className="native-select"
                value={sort}
                onChange={(event) => onSortChange?.(event.target.value as 'balanced' | 'recent')}
              >
                <option value="balanced">Employer variety</option>
                <option value="recent">Recently updated</option>
              </select>
            </div>
            <Button asChild variant="outline" className="gap-1.5 px-2 text-xs sm:px-3 sm:text-sm">
              <Link to="/saved" aria-label="View saved jobs">
                <Bookmark className="h-4 w-4" aria-hidden="true" />
                <span>Saved</span>
              </Link>
            </Button>
          </div>
        </div>
        <div className="mt-2 flex items-start justify-between gap-2">
          <div
            className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-muted"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {isLoading ? (
              'Loading jobs…'
            ) : isGuest && totalJobs > visibleJobs ? (
              <>
                Showing the first {visibleJobs.toLocaleString()} matching jobs.
                <button
                  type="button"
                  onClick={onSignIn}
                  className="min-h-8 font-medium text-primary underline underline-offset-2"
                >
                  Sign in to see all {totalJobs.toLocaleString()} matches
                </button>
              </>
            ) : (
              `${totalJobs.toLocaleString()} matching ${totalJobs === 1 ? 'job' : 'jobs'}${totalJobs > visibleJobs ? ` · Showing ${visibleJobs.toLocaleString()}` : ''}`
            )}
          </div>
          {onExportCsv && (
            <details ref={menuRef} className="relative shrink-0">
              <summary
                className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg border border-border text-muted hover:bg-page focus-visible:outline-2 focus-visible:outline-primary"
                aria-label="More job actions"
              >
                <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
              </summary>
              <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-lg border border-border bg-surface p-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    if (menuRef.current) menuRef.current.open = false;
                    onExportCsv();
                  }}
                  disabled={isExporting || (!isGuest && totalJobs === 0)}
                  className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-left text-sm text-ink hover:bg-page disabled:opacity-50"
                >
                  <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {isExporting
                    ? 'Preparing export…'
                    : isGuest
                      ? 'Sign in to export CSV'
                      : 'Export filtered jobs to CSV'}
                </button>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
