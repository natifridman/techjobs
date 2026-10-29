import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useJobsFilters } from '@/hooks/useJobsFilters';

function renderFilters(route: string) {
  return renderHook(() => ({
    ...useJobsFilters(),
    location: useLocation(),
    navigate: useNavigate(),
  }), {
    wrapper: ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>,
  });
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('jobs search history', () => {
  it('preserves draft whitespace without creating duplicate history entries', () => {
    const { result } = renderFilters('/jobs');
    act(() => result.current.setSearchQuery(' software '));
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.searchQuery).toBe(' software ');
    expect(result.current.location.search).toBe('?search=software');
    const committedKey = result.current.location.key;
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.location.key).toBe(committedKey);

    act(() => result.current.setSearchQuery(' software engineer '));
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.searchQuery).toBe(' software engineer ');
    expect(result.current.location.search).toBe('?search=software+engineer');
    act(() => result.current.navigate(-1));
    expect(result.current.searchQuery).toBe('software');
    act(() => result.current.navigate(1));
    expect(result.current.searchQuery).toBe('software engineer');
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.location.search).toBe('?search=software+engineer');
  });

  it.each(['', '?search=Backend'])('restores the committed search after Back and Forward from /jobs%s', query => {
    const { result } = renderFilters(`/jobs${query}`);
    const originalSearch = result.current.searchQuery;
    act(() => result.current.setSearchQuery('Engineer'));
    act(() => vi.advanceTimersByTime(250));
    expect(result.current.location.search).toBe('?search=Engineer');

    act(() => result.current.navigate(-1));
    expect(result.current.searchQuery).toBe(originalSearch);
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.location.search).toBe(query);

    act(() => result.current.navigate(1));
    expect(result.current.searchQuery).toBe('Engineer');
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.location.search).toBe('?search=Engineer');
  });

  it('discards pending drafts when moving between history entries', () => {
    const { result } = renderFilters('/jobs');
    act(() => result.current.setSearchQuery('Engineer'));
    act(() => vi.advanceTimersByTime(250));
    act(() => result.current.setSearchQuery('stale draft'));

    act(() => result.current.navigate(-1));
    expect(result.current.searchQuery).toBe('');
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.location.search).toBe('');

    act(() => result.current.navigate(1));
    expect(result.current.searchQuery).toBe('Engineer');
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.location.search).toBe('?search=Engineer');
  });
});
