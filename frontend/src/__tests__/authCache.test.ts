import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import type { AuthState } from '@/api/auth';
import { clearJobAccessCache, revokeJobAccess } from '@/hooks/authCache';

describe('job access cache isolation', () => {
  it('removes other user/guest records while retaining the current scope and public catalog', () => {
    const client = new QueryClient();
    client.setQueryData(['jobs', 'old-user', ''], { jobs: ['private'] });
    client.setQueryData(['jobs', 'guest', ''], { jobs: ['preview'] });
    client.setQueryData(['jobs', 'new-user', ''], { jobs: ['current'] });
    client.setQueryData(['jobsCatalog'], { total: 100 });
    client.setQueryData(['savedJobs', 'old-user'], ['private note']);
    client.setQueryData(['savedJobs', 'new-user'], ['current save']);
    clearJobAccessCache(client, 'new-user');
    expect(client.getQueryData(['jobs', 'old-user', ''])).toBeUndefined();
    expect(client.getQueryData(['jobs', 'guest', ''])).toBeUndefined();
    expect(client.getQueryData(['jobs', 'new-user', ''])).toEqual({ jobs: ['current'] });
    expect(client.getQueryData(['jobsCatalog'])).toEqual({ total: 100 });
    expect(client.getQueryData(['savedJobs', 'old-user'])).toBeUndefined();
    expect(client.getQueryData(['savedJobs', 'new-user'])).toEqual(['current save']);
    client.clear();
  });

  it('aborts an in-flight authenticated request before switching to guest', async () => {
    const client = new QueryClient();
    let signal: AbortSignal | undefined;
    const pending = client.fetchQuery({
      queryKey: ['jobs', 'user', 'page=2'],
      queryFn: (context) => {
        signal = context.signal;
        return new Promise(() => {});
      },
    }).catch(() => undefined);
    client.setQueryData(['auth'], { authenticated: true, user: { id: 'user' } });
    client.setQueryData(['savedJobs', 'user'], ['private-account-note']);
    localStorage.setItem('techjobs_saved_jobs', JSON.stringify([{ id: 'guest-save' }]));
    revokeJobAccess(client);
    expect(signal?.aborted).toBe(true);
    expect(client.getQueriesData({ queryKey: ['jobs'] })).toEqual([]);
    expect(client.getQueryData(['auth'])).toEqual({ authenticated: false, user: null });
    expect(client.getQueriesData({ queryKey: ['savedJobs'] })).toEqual([]);
    expect(JSON.parse(localStorage.getItem('techjobs_saved_jobs')!)).toEqual([{ id: 'guest-save' }]);
    await pending;
    client.clear();
  });

  it('keeps guest identity when a refresh started before logout resolves afterward', async () => {
    const client = new QueryClient();
    const signedIn: AuthState = {
      authenticated: true,
      user: { id: 'user', name: 'User', email: 'user@example.com', picture: '' },
    };
    client.setQueryData(['auth'], signedIn);
    let release!: (value: AuthState) => void;
    const response = new Promise<AuthState>(resolve => { release = resolve; });
    // Like authApi.getMe, this query does not consume the abort signal.
    const refresh = client.fetchQuery({ queryKey: ['auth'], queryFn: () => response }).catch(() => undefined);

    revokeJobAccess(client);
    expect(client.getQueryData(['auth'])).toEqual({ authenticated: false, user: null });
    release(signedIn);
    await response;
    await refresh;

    expect(client.getQueryData(['auth'])).toEqual({ authenticated: false, user: null });
    client.clear();
  });
});
