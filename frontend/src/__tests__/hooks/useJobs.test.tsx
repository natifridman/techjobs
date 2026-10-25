import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useJobs, jobsQueryKey } from '@/hooks/useJobs';
import type { AuthState } from '@/api/auth';

const posthog = { identify: vi.fn(), capture: vi.fn(), reset: vi.fn() };
vi.mock('posthog-js/react', () => ({ usePostHog: () => posthog }));
vi.mock('@/api/storage', () => ({ reconcileGuestSavedJobs: async () => 0 }));
const user = { id: 'account-a', name: 'User', email: 'a@example.com', picture: '' };
const member: AuthState = { authenticated: true, user };
const guest: AuthState = { authenticated: false, user: null };
function payload(access: 'guest' | 'authenticated', company = 'A') {
  return { jobs: [{ company, title: 'Engineer', url: `https://x/${company}`, job_category: 'software' }], total: 24,
    access, page: 1, pageSize: access === 'guest' ? 10 : 20, previewLimit: access === 'guest' ? 10 : null,
    requiresAuth: access === 'guest', updatedAt: '2026-10-20', stale: false };
}
function harness(auth?: AuthState) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  if (auth) client.setQueryData(['auth'], auth);
  return { client, wrapper: ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> };
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('jobs access scopes', () => {
  it('keys results by account and canonical filter order', () => {
    expect(jobsQueryKey('guest', { city: ['Haifa', 'Tel Aviv'] })).toEqual(jobsQueryKey('guest', { city: ['Tel Aviv', 'Haifa', 'Haifa'] }));
    expect(jobsQueryKey('guest', {})).not.toEqual(jobsQueryKey('account-a', {}));
  });
  it('waits for authentication resolution before requesting jobs', async () => {
    let resolveAuth!: (value: Response) => void;
    const fetchMock = vi.fn((url: string) => url === '/auth/me' ? new Promise<Response>(resolve => { resolveAuth = resolve; }) : Promise.resolve({ ok: true, json: async () => payload('guest') } as Response));
    vi.stubGlobal('fetch', fetchMock); const { wrapper } = harness(); const hook = renderHook(() => useJobs(), { wrapper });
    expect(hook.result.current.isLoading).toBe(true); expect(fetchMock.mock.calls.some(([url]) => url.startsWith('/api/jobs'))).toBe(false);
    await act(async () => resolveAuth({ ok: true, json: async () => guest } as Response));
    await waitFor(() => expect(hook.result.current.data?.access).toBe('guest'));
    expect(fetchMock.mock.calls.filter(([url]) => url.startsWith('/api/jobs'))).toHaveLength(1);
  });
  it('uses the account scope and aborts in-flight jobs when unmounted', async () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal('fetch', vi.fn((_url: string, options?: RequestInit) => { signal = options?.signal as AbortSignal; return new Promise<Response>(() => {}); }));
    const { client, wrapper } = harness(member); const hook = renderHook(() => useJobs({ category: ['software'] }), { wrapper });
    await waitFor(() => expect(signal).toBeDefined()); expect(client.getQueryCache().find({ queryKey: jobsQueryKey(user.id, { category: ['software'] }) })).toBeDefined();
    hook.unmount(); expect(signal?.aborted).toBe(true);
  });
  it('revokes old account results when the server returns guest access', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => payload('guest') })));
    const { client, wrapper } = harness(member);
    client.setQueryData(jobsQueryKey(user.id, { search: 'private' }), payload('authenticated', 'Old account result'));
    const hook = renderHook(() => useJobs(), { wrapper });
    await waitFor(() => expect(client.getQueryData<AuthState>(['auth'])?.authenticated).toBe(false));
    await waitFor(() => expect(hook.result.current.data?.access).toBe('guest'));
    expect(client.getQueryCache().findAll({ queryKey: ['jobs', user.id] })).toHaveLength(0);
  });
  it('revokes expired auth on AUTH_REQUIRED without retrying indefinitely', async () => {
    const fetchMock = vi.fn(async () => ({ ok: false, status: 401, json: async () => ({ code: 'AUTH_REQUIRED', error: 'Sign in' }) }));
    vi.stubGlobal('fetch', fetchMock); const { client, wrapper } = harness(member); const hook = renderHook(() => useJobs({ page: 2 }), { wrapper });
    await waitFor(() => expect(client.getQueryData<AuthState>(['auth'])?.authenticated).toBe(false));
    await waitFor(() => expect(hook.result.current.isError).toBe(true)); expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(2);
    expect(client.getQueryCache().findAll({ queryKey: ['jobs', user.id] })).toHaveLength(0);
  });
  it('never reuses results when the active account changes', async () => {
    let company = 'A'; vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => payload('authenticated', company) })));
    const { client, wrapper } = harness(member); const hook = renderHook(() => useJobs(), { wrapper }); await waitFor(() => expect(hook.result.current.data?.jobs[0].company).toBe('A'));
    company = 'B'; act(() => client.setQueryData(['auth'], { authenticated: true, user: { ...user, id: 'account-b' } }));
    await waitFor(() => expect(hook.result.current.data?.jobs[0].company).toBe('B'));
    expect(client.getQueryCache().findAll({ queryKey: ['jobs', 'account-a'] })).toHaveLength(0);
  });
});
