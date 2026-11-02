import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  BookmarkX,
  CheckCircle2,
  Circle,
  ExternalLink,
  MapPin,
  MessageSquare,
  Pencil,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePostHog } from 'posthog-js/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import CompanyLogo from '@/components/CompanyLogo';
import { reconcileGuestSavedJobs, savedJobsApi, type SavedJob } from '@/api/storage';
import { useAuth } from '@/hooks/useAuth';
import { useSavedJobs } from '@/hooks/useSavedJobs';
import { CATEGORY_LABELS } from '@/components/jobs/jobsData';

type Filter = 'all' | 'applied' | 'not-applied';
export default function SavedJobs() {
  const auth = useAuth();
  const scope = auth.isAuthenticated && auth.user ? `account:${auth.user.id}` : 'guest';
  // Remount the editor when its owner changes, so private drafts and pending
  // controls reset with the account rather than in a follow-up effect.
  return <SavedJobsContent key={scope} auth={auth} />;
}

function SavedJobsContent({ auth }: { auth: ReturnType<typeof useAuth> }) {
  const client = useQueryClient();
  const posthog = usePostHog();
  const account = auth.isAuthenticated && auth.user ? auth.user.id : null;
  const lifetime = useRef({ active: true });
  useEffect(() => {
    const current = lifetime.current;
    current.active = true;
    return () => {
      current.active = false;
    };
  }, []);
  const saved = useSavedJobs();
  const jobs = saved.data || [];
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(new Set<string>());
  const locks = useRef(new Set<string>());
  const sync = useMutation({
    mutationFn: reconcileGuestSavedJobs,
    onSuccess: () => client.invalidateQueries({ queryKey: ['savedJobs'] }),
    onError: () => toast.error('Could not sync yet. Your browser saves are still here.'),
  });
  useEffect(() => {
    if (!auth.isAuthenticated) return;
    let active = true;
    void reconcileGuestSavedJobs()
      .catch(() => {})
      .finally(() => {
        if (active) void client.invalidateQueries({ queryKey: ['savedJobs'] });
      });
    return () => {
      active = false;
    };
  }, [auth.isAuthenticated, account, client]);
  const refresh = () => client.invalidateQueries({ queryKey: ['savedJobs'] });
  const perform = async (job: SavedJob, action: () => Promise<void>) => {
    if (locks.current.has(job.url)) return;
    locks.current.add(job.url);
    setPending(new Set(locks.current));
    try {
      await action();
    } catch {
      if (lifetime.current.active) {
        setErrors((previous) => ({ ...previous, [job.id]: 'Could not save this change. Please try again.' }));
        toast.error('Could not save this change. Please try again.');
      }
    } finally {
      locks.current.delete(job.url);
      if (lifetime.current.active) setPending(new Set(locks.current));
    }
  };
  const edit = (job: SavedJob) => {
    setEditing(job.id);
    setDrafts((previous) => ({ ...previous, [job.id]: previous[job.id] ?? job.comments ?? '' }));
    setErrors((previous) => ({ ...previous, [job.id]: '' }));
  };
  const saveNote = (job: SavedJob) =>
    perform(job, async () => {
      const updated = await savedJobsApi.update(job.id, { comments: drafts[job.id] || '' }, job.url);
      if (!updated) throw new Error('Note not saved');
      await refresh();
      if (!lifetime.current.active) return;
      setEditing((current) => (current === job.id ? null : current));
      setDrafts((previous) => {
        const next = { ...previous };
        delete next[job.id];
        return next;
      });
      setErrors((previous) => ({ ...previous, [job.id]: '' }));
      toast.success('Note saved');
    });
  const toggleApplied = (job: SavedJob) =>
    perform(job, async () => {
      const updated = await savedJobsApi.update(
        job.id,
        {
          applied: !job.applied,
          applied_date: !job.applied
            ? new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' })
            : undefined,
        },
        job.url,
      );
      if (!updated) throw new Error('Status not saved');
      await refresh();
      if (!lifetime.current.active) return;
      setErrors((previous) => ({ ...previous, [job.id]: '' }));
    });
  const remove = (job: SavedJob) =>
    perform(job, async () => {
      if (!(await savedJobsApi.delete(job.id, job.url))) throw new Error('Job not removed');
      await refresh();
      if (!lifetime.current.active) return;
      toast.success('Job removed from saved', {
        duration: 8000,
        action: {
          label: 'Undo',
          onClick: async () => {
            // Undo can outlive this page. Storage verifies the original
            // owner before restoring, including after navigation/sign-in.
            try {
              await savedJobsApi.restore(job, account);
              await refresh();
              toast.success('Job restored, including your note and application status');
            } catch {
              toast.error('Could not restore this job. Please try saving it again.');
            }
          },
        },
      });
    });
  const applied = jobs.filter((job) => job.applied).length;
  const pendingCount = jobs.filter((job) => job.pending).length;
  const filtered = jobs.filter(
    (job) => filter === 'all' || (filter === 'applied' ? job.applied : !job.applied),
  );
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="section-heading">
        <div>
          <p className="eyebrow mb-2">Your next move, organized</p>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Saved Jobs</h1>
          <p className="mt-2 text-sm text-muted">
            {saved.isLoading
              ? 'Loading your shortlist…'
              : `${jobs.length} ${jobs.length === 1 ? 'job' : 'jobs'} saved · ${applied} applied`}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/jobs">Browse jobs</Link>
        </Button>
      </div>
      {!auth.isAuthenticated && (
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-iris-200 bg-iris-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-ink">Saved on this browser</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
              Your shortlist, notes and application status stay on this device. Sign in to keep them with you
              across devices.
            </p>
          </div>
          <Button onClick={() => auth.login(window.location.href)} className="shrink-0">
            Sign in to sync
          </Button>
        </div>
      )}
      {auth.isAuthenticated && pendingCount > 0 && (
        <div
          role="status"
          className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning-border bg-warning-bg p-4"
        >
          <p className="text-sm text-warning">
            {pendingCount} saved {pendingCount === 1 ? 'job has' : 'jobs have'} not synced to your account
            yet.
          </p>
          <Button variant="outline" onClick={() => sync.mutate()} disabled={sync.isPending}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${sync.isPending ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            Retry sync
          </Button>
        </div>
      )}
      {saved.isError && jobs.length > 0 && (
        <div
          role="status"
          className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning-border bg-warning-bg p-4 text-sm text-warning"
        >
          Could not refresh your shortlist. Showing the last loaded jobs.
          <Button variant="outline" onClick={() => saved.refetch()}>
            Retry
          </Button>
        </div>
      )}
      {jobs.length > 0 && (
        <div className="my-6 flex flex-wrap gap-2" role="group" aria-label="Filter saved jobs">
          {[
            { value: 'all' as const, label: `All (${jobs.length})` },
            { value: 'applied' as const, label: `Applied (${applied})` },
            { value: 'not-applied' as const, label: `Not applied (${jobs.length - applied})` },
          ].map((item) => (
            <Button
              key={item.value}
              size="sm"
              variant={filter === item.value ? 'default' : 'outline'}
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      )}
      {saved.isLoading ? (
        <div role="status" aria-label="Loading saved jobs" className="mt-6 grid gap-4 lg:grid-cols-2">
          {[0, 1].map((index) => (
            <div key={index} className="h-56 animate-pulse rounded-2xl border border-border bg-warm-100" />
          ))}
        </div>
      ) : saved.isError && jobs.length === 0 ? (
        <div role="alert" className="mt-6 rounded-2xl border border-border bg-surface p-10 text-center">
          <h2 className="text-lg font-semibold text-ink">Saved jobs could not be loaded</h2>
          <p className="mt-2 text-sm text-muted">
            Your shortlist may still be available. Check your connection and try again.
          </p>
          <Button className="mt-5" onClick={() => saved.refetch()}>
            Retry saved jobs
          </Button>
        </div>
      ) : !filtered.length ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface p-10 text-center sm:p-14">
          <Bookmark className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold text-ink">
            {jobs.length === 0
              ? 'Start your next chapter with a shortlist'
              : filter === 'applied'
                ? 'No applied jobs yet'
                : 'You’ve applied to every saved role'}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
            {jobs.length === 0
              ? 'Save a role while browsing. Your notes and application status will live here.'
              : 'Switch filters to see the rest of your shortlist.'}
          </p>
          {jobs.length === 0 ? (
            <Button asChild className="mt-5">
              <Link to="/jobs">Find roles to save</Link>
            </Button>
          ) : (
            <Button variant="outline" className="mt-5" onClick={() => setFilter('all')}>
              View all saved jobs
            </Button>
          )}
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          {filtered.map((job) => (
            <article
              key={job.id}
              aria-label={`${job.job_title} at ${job.company}`}
              className="min-w-0 rounded-2xl border border-border bg-surface p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <CompanyLogo name={job.company} className="h-10 w-10" />
                <div className="min-w-0 flex-1">
                  <h2 className="break-words text-lg font-semibold leading-6 text-ink" dir="auto">
                    {job.job_title}
                  </h2>
                  <Link
                    to={`/company?name=${encodeURIComponent(job.company)}`}
                    className="mt-1 inline-block text-sm font-medium text-muted hover:text-primary hover:underline"
                  >
                    <bdi>{job.company}</bdi>
                  </Link>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={pending.has(job.url)}
                  aria-label={`Remove ${job.job_title} from saved jobs`}
                  onClick={() => remove(job)}
                >
                  <BookmarkX className="h-4 w-4 text-muted" aria-hidden="true" />
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {job.job_category && (
                  <Badge variant="secondary">
                    {CATEGORY_LABELS[job.job_category] || job.job_category.replace(/-/g, ' ')}
                  </Badge>
                )}
                {job.level && (
                  <Badge variant="outline" className="capitalize">
                    {job.level}
                  </Badge>
                )}
                {job.pending && (
                  <Badge variant="outline" className="border-warning-border bg-warning-bg text-warning">
                    Not synced yet
                  </Badge>
                )}
                {job.applied && (
                  <Badge className="border-success-border bg-success-bg text-success">
                    Applied
                    {job.applied_date && Number.isFinite(Date.parse(job.applied_date))
                      ? ` · ${new Date(`${job.applied_date.slice(0, 10)}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
                      : ''}
                  </Badge>
                )}
              </div>
              {job.city && (
                <p className="mt-3 flex items-start gap-1.5 text-sm text-muted">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <bdi>{job.city}</bdi>
                </p>
              )}
              {editing === job.id ? (
                <div className="mt-4">
                  <label htmlFor={`note-${job.id}`} className="mb-2 block text-sm font-medium text-ink">
                    Your note
                  </label>
                  <Textarea
                    id={`note-${job.id}`}
                    aria-label={`Note for ${job.job_title}`}
                    aria-describedby={errors[job.id] ? `error-${job.id}` : undefined}
                    disabled={pending.has(job.url)}
                    value={drafts[job.id] ?? ''}
                    onChange={(event) =>
                      setDrafts((previous) => ({ ...previous, [job.id]: event.target.value }))
                    }
                    placeholder="What would you like to remember about this role?"
                    className="min-h-28"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending.has(job.url)}
                      onClick={() => {
                        setEditing(null);
                        setDrafts((previous) => {
                          const next = { ...previous };
                          delete next[job.id];
                          return next;
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" disabled={pending.has(job.url)} onClick={() => saveNote(job)}>
                      {pending.has(job.url) ? 'Saving…' : 'Save note'}
                    </Button>
                  </div>
                </div>
              ) : job.comments ? (
                <div className="mt-4 flex items-start justify-between gap-2 rounded-xl bg-page p-3">
                  <p className="min-w-0 whitespace-pre-wrap break-words text-sm leading-6 text-muted">
                    {job.comments}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={pending.has(job.url)}
                    aria-label={`Edit note for ${job.job_title}`}
                    onClick={() => edit(job)}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              ) : null}
              {errors[job.id] && (
                <p id={`error-${job.id}`} role="alert" className="mt-3 text-sm text-danger">
                  {errors[job.id]}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-pressed={!!job.applied}
                    disabled={pending.has(job.url)}
                    onClick={() => toggleApplied(job)}
                    className={`gap-1.5 px-2 ${job.applied ? 'text-success' : ''}`}
                  >
                    {job.applied ? (
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Circle className="h-4 w-4" aria-hidden="true" />
                    )}
                    {job.applied ? 'Applied' : 'Mark applied'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending.has(job.url)}
                    onClick={() => edit(job)}
                    className="gap-1.5 px-2"
                  >
                    <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    {job.comments ? 'Edit note' : 'Add note'}
                  </Button>
                </div>
                <Button asChild size="sm">
                  <a
                    href={job.url}
                    onClick={() =>
                      posthog.capture('job_apply_clicked', {
                        company: job.company,
                        job_title: job.job_title,
                        source_page: '/saved',
                      })
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Apply to ${job.job_title} at ${job.company} (opens in new window)`}
                  >
                    Apply
                    <ExternalLink className="ml-2 h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
