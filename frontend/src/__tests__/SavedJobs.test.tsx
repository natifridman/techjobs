import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SavedJobs from '@/pages/SavedJobs';
import { savedJobsApi } from '@/api/storage';
import type { SavedJob } from '@/api/storage';
import type { ReactNode } from 'react';

const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  auth: { isAuthenticated: false, user: null as null | { id: string }, login: vi.fn() },
}));
vi.mock('@/hooks/useSavedJobs', () => ({ useSavedJobs: mocks.read }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => mocks.auth }));
vi.mock('@/api/storage', () => ({
  savedJobsApi: { update: vi.fn(), delete: vi.fn(), restore: vi.fn() },
  reconcileGuestSavedJobs: vi.fn().mockResolvedValue(0),
}));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error } }));
const job: SavedJob = {
  id: 'one',
  job_title: 'Backend Engineer',
  company: 'Example',
  url: 'https://example.com/one',
  comments: 'Keep this note',
  applied: true,
  applied_date: '2026-11-01',
  created_date: '2026-11-01',
};
const second = { ...job, id: 'two', url: 'https://example.com/two', job_title: 'Designer', applied: false };
function renderPage() {
  const client = new QueryClient();
  return render(<SavedJobs />, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    ),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.isAuthenticated = false;
  mocks.auth.user = null;
  mocks.read.mockReturnValue({ data: [job, second], isLoading: false, isError: false, refetch: vi.fn() });
  vi.mocked(savedJobsApi.delete).mockResolvedValue(true);
  vi.mocked(savedJobsApi.restore).mockResolvedValue(job);
});
describe('saved-job recovery', () => {
  it('retains the edited note and keeps the editor open when saving fails', async () => {
    vi.mocked(savedJobsApi.update).mockRejectedValue(new Error('offline'));
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Edit note for Backend Engineer' }));
    const input = screen.getByRole('textbox', { name: 'Note for Backend Engineer' });
    await user.clear(input);
    await user.type(input, 'Do not lose my draft');
    await user.click(screen.getByRole('button', { name: 'Save note' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save this change');
    expect(input).toHaveValue('Do not lose my draft');
    expect(screen.getByRole('button', { name: 'Save note' })).toBeEnabled();
  });
  it('prevents repeated writes for one job without blocking a different job', async () => {
    let resolve!: (job: SavedJob) => void;
    vi.mocked(savedJobsApi.update).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const user = userEvent.setup();
    renderPage();
    const firstCard = screen.getByRole('article', { name: 'Backend Engineer at Example' });
    await user.dblClick(within(firstCard).getByRole('button', { name: 'Applied' }));
    expect(savedJobsApi.update).toHaveBeenCalledTimes(1);
    expect(within(firstCard).getByRole('button', { name: 'Applied' })).toBeDisabled();
    expect(
      within(screen.getByRole('article', { name: 'Designer at Example' })).getByRole('button', {
        name: 'Mark applied',
      }),
    ).toBeEnabled();
    await act(async () => resolve(job));
  });
  it('restores the removed record with its notes and application status through Undo', async () => {
    const user = userEvent.setup();
    const { unmount } = renderPage();
    await user.click(screen.getByRole('button', { name: 'Remove Backend Engineer from saved jobs' }));
    await waitFor(() =>
      expect(mocks.success).toHaveBeenCalledWith(
        'Job removed from saved',
        expect.objectContaining({ action: expect.any(Object) }),
      ),
    );
    const options = mocks.success.mock.calls.find((call) => call[0] === 'Job removed from saved')![1];
    unmount();
    await act(async () => options.action.onClick());
    expect(savedJobsApi.restore).toHaveBeenCalledWith(
      expect.objectContaining({ comments: 'Keep this note', applied: true, applied_date: '2026-11-01' }),
      null,
    );
  });
  it('shows an unavailable state instead of an empty shortlist when loading fails', () => {
    mocks.read.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: vi.fn() });
    renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent('Saved jobs could not be loaded');
    expect(screen.queryByText('Start your next chapter with a shortlist')).not.toBeInTheDocument();
  });
  it('discards the previous account’s note draft when the account changes', async () => {
    const user = userEvent.setup();
    const { rerender } = renderPage();
    await user.click(screen.getByRole('button', { name: 'Edit note for Backend Engineer' }));
    await user.type(screen.getByRole('textbox', { name: 'Note for Backend Engineer' }), ' Private draft');
    mocks.auth.isAuthenticated = true;
    mocks.auth.user = { id: 'another-account' };
    rerender(<SavedJobs />);
    expect(screen.queryByRole('textbox', { name: 'Note for Backend Engineer' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Edit note for Backend Engineer' }));
    expect(screen.getByRole('textbox', { name: 'Note for Backend Engineer' })).toHaveValue('Keep this note');
  });
  it('does not let an old account’s completed write unlock a new account’s pending action', async () => {
    const resolves: Array<(value: SavedJob) => void> = [];
    vi.mocked(savedJobsApi.update).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolves.push(resolve);
        }),
    );
    const user = userEvent.setup();
    const { rerender } = renderPage();
    const appliedButton = () =>
      within(screen.getByRole('article', { name: 'Backend Engineer at Example' })).getByRole('button', {
        name: 'Applied',
      });
    await user.click(appliedButton());
    mocks.auth.isAuthenticated = true;
    mocks.auth.user = { id: 'another-account' };
    rerender(<SavedJobs />);
    expect(appliedButton()).toBeEnabled();
    await user.click(appliedButton());
    await act(async () => resolves[0](job));
    expect(appliedButton()).toBeDisabled();
    await act(async () => resolves[1](job));
    expect(appliedButton()).toBeEnabled();
  });
});
