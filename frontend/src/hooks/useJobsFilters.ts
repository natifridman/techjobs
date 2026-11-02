import { useCallback, useEffect, useMemo, useState, type SetStateAction } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { jobsQueryParams } from '@/api/jobs';
import { EMPTY_FILTERS, filtersToQuery, readJobsFilters, type Filters } from '@/components/jobs/filters';

/** The URL owns committed filters; the text field alone waits 250ms before committing. */
export function useJobsFilters(cities?: string[], allowPagination = true) {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const parsed = useMemo(() => readJobsFilters(new URLSearchParams(location.search), cities), [location.search, cities]);
  const { filters, company } = parsed;
  const page = allowPagination ? parsed.page : 1;
  const [input, setInput] = useState({ key: location.key, value: filters.search, pendingSearch: null as string | null });
  // Keep whitespace through our own commit; history navigation restores URL text.
  const keepDraft = input.key === location.key || (navigationType !== 'POP' && input.pendingSearch === filters.search);
  const searchQuery = keepDraft ? input.value : filters.search;
  if (input.key !== location.key) setInput({ key: location.key, value: searchQuery, pendingSearch: null });
  const setSearchQuery = (value: string) => setInput({ key: location.key, value, pendingSearch: null });

  const write = useCallback((next: Filters, nextPage = 1, nextCompany = company, replace = false) => {
    const search = jobsQueryParams(filtersToQuery(next, nextPage, nextCompany)).toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '', hash: location.hash }, { replace });
  }, [company, location.pathname, location.hash, navigate]);

  // A history navigation changes the key, immediately restoring the URL's text.
  useEffect(() => {
    if (searchQuery.trim() === filters.search) return;
    const timer = setTimeout(() => {
      setInput({ key: location.key, value: searchQuery, pendingSearch: searchQuery.trim() });
      write({ ...filters, search: searchQuery });
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, filters, write, location.key]);

  useEffect(() => {
    const canonical = jobsQueryParams(filtersToQuery(filters, page, company)).toString();
    if (canonical !== new URLSearchParams(location.search).toString()) write(filters, page, company, true);
  }, [filters, page, company, location.search, write]);

  const setFilters = (update: SetStateAction<Filters>) => {
    const next = typeof update === 'function' ? update(filters) : update;
    setSearchQuery(next.search);
    write(next);
  };

  return {
    filters, setFilters, searchQuery, setSearchQuery, page, company,
    setCompany: (next: string) => write(filters, 1, next),
    clearAll: () => { setSearchQuery(''); write({ ...EMPTY_FILTERS }, 1, ''); },
    setPage: (next: number) => write(filters, next),
    query: filtersToQuery(filters, page, company),
  };
}
