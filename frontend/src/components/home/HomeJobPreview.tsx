import { useJobs } from '@/hooks/useJobs';
import { useJobActions } from '@/hooks/useJobActions';
import JobCard from '@/components/jobs/JobCard';
import { Button } from '@/components/ui/button';

export default function HomeJobPreview() {
  const { data, isLoading, isError, refetch } = useJobs({ sort: 'balanced' });
  const actions = useJobActions();
  if (isLoading)
    return (
      <div role="status" aria-label="Loading job previews" className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-64 animate-pulse rounded-2xl border border-border bg-surface" />
        ))}
      </div>
    );
  if (isError)
    return (
      <div
        role="status"
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-5"
      >
        <p className="text-muted">Job previews are temporarily unavailable. You can still browse jobs.</p>
        <Button variant="outline" onClick={() => refetch()}>
          Retry previews
        </Button>
      </div>
    );
  if (!data?.jobs.length)
    return (
      <p className="rounded-xl border border-border bg-surface p-6 text-muted">
        No open roles right now. Check back for new opportunities.
      </p>
    );
  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-3">
      {data.jobs.slice(0, 3).map((job) => (
        <JobCard
          key={job.url}
          job={job}
          onSave={actions.saveJob}
          isSaved={actions.isSaved(job)}
          onApply={actions.markApplied}
          isApplied={actions.isApplied(job)}
          isSaving={actions.isSaving(job)}
          isUpdating={actions.isUpdating(job)}
        />
      ))}
    </div>
  );
}
