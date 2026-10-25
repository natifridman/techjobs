import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal, Bookmark, Download, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

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
}

export default function SearchHeader({ searchQuery, setSearchQuery, onFilterClick, totalJobs, visibleJobs,
  activeFiltersCount, isLoading, isGuest, onExportCsv, isExporting }: SearchHeaderProps) {
  return (
    <div className="sticky top-16 z-20 border-b border-warm-200 bg-surface/95 backdrop-blur-md" role="search">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" aria-hidden="true" />
            <Input type="search" placeholder="Job title, company, or keyword" value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)} className="h-11 bg-warm-50 pl-9 border-warm-200"
              aria-label="Search jobs, companies, or keywords" autoComplete="off" />
          </div>
          <Button data-job-filter-trigger variant="outline" onClick={onFilterClick} className="lg:hidden gap-2"
            aria-label={`Open filters${activeFiltersCount ? ` (${activeFiltersCount} active)` : ''}`}>
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Filters</span>
            {!!activeFiltersCount && <span className="rounded-full bg-action px-1.5 py-0.5 text-xs text-action-foreground">{activeFiltersCount}</span>}
          </Button>
          <Button asChild variant="outline" className="gap-2"><Link to={createPageUrl('SavedJobs')} aria-label="View saved jobs"><Bookmark className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Saved jobs</span></Link></Button>
          {onExportCsv && <details className="relative shrink-0">
            <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg border border-warm-200 bg-surface text-warm-600 hover:bg-warm-50 focus-visible:outline-2 focus-visible:outline-iris-600" aria-label="More job actions"><MoreHorizontal className="h-5 w-5" aria-hidden="true" /></summary>
            <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-warm-200 bg-surface p-1 shadow-lg">
              <button type="button" onClick={onExportCsv} disabled={isExporting || (!isGuest && totalJobs === 0)} className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-left text-sm text-warm-700 hover:bg-warm-50 disabled:opacity-50"><Download className="h-4 w-4" aria-hidden="true" />{isExporting ? 'Preparing export…' : isGuest ? 'Sign in to export CSV' : 'Export filtered jobs to CSV'}</button>
            </div>
          </details>}
        </div>
        <div className="mt-2 text-xs text-warm-500" role="status" aria-live="polite" aria-atomic="true">
          {isLoading ? 'Loading jobs…' : `Showing ${visibleJobs.toLocaleString()} of ${totalJobs.toLocaleString()} matching jobs`}
          {isGuest && !isLoading && <span className="ml-2 text-iris-700">Guest preview</span>}
        </div>
      </div>
    </div>
  );
}
