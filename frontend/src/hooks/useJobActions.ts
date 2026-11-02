import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePostHog } from 'posthog-js/react';
import { toast } from 'sonner';
import { savedJobsApi } from '@/api/storage';
import { useSavedJobs } from './useSavedJobs';
import { displayCity, type Job } from '@/components/jobs/jobsData';

export function useJobActions() {
  const client = useQueryClient();
  const posthog = usePostHog();
  const { data: savedJobs = [] } = useSavedJobs();
  const pending = useRef(new Set<string>());
  const record = (job: Job) => ({
    job_title: job.title,
    company: job.company,
    category: job.department || undefined,
    city: displayCity(job),
    url: job.url,
    level: job.seniority || undefined,
    job_category: job.job_category,
  });
  const save = useMutation({
    mutationFn: async (job: Job) => {
      const existing = savedJobs.find((item) => item.url === job.url);
      if (existing) {
        if (!(await savedJobsApi.delete(existing.id, existing.url))) throw new Error('Removal failed');
      } else await savedJobsApi.create(record(job));
      return { job, removed: !!existing };
    },
    onSuccess: async ({ job, removed }) => {
      await client.invalidateQueries({ queryKey: ['savedJobs'] });
      toast.success(removed ? 'Job removed from saved' : 'Job saved!');
      posthog.capture(removed ? 'job_unsaved' : 'job_saved', { job_title: job.title, company: job.company });
    },
    onError: () => toast.error('Could not update saved jobs. Please try again.'),
    onSettled: (_data, _error, job) => {
      pending.current.delete(job.url);
    },
  });
  const applied = useMutation({
    mutationFn: async (job: Job) => {
      const existing = savedJobs.find((item) => item.url === job.url);
      const next = !existing?.applied;
      const applied_date = next
        ? new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' })
        : undefined;
      if (existing) {
        if (!(await savedJobsApi.update(existing.id, { applied: next, applied_date }, existing.url)))
          throw new Error('Update failed');
      } else await savedJobsApi.create({ ...record(job), applied: true, applied_date });
      return { job, applied: next };
    },
    onSuccess: async ({ job, applied: marked }) => {
      await client.invalidateQueries({ queryKey: ['savedJobs'] });
      toast.success(marked ? 'Marked as applied!' : 'Unmarked as applied');
      posthog.capture(marked ? 'job_applied' : 'job_unapplied', {
        job_title: job.title,
        company: job.company,
      });
    },
    onError: () => toast.error('Could not update the application status. Please try again.'),
    onSettled: (_data, _error, job) => {
      pending.current.delete(job.url);
    },
  });
  const run = (job: Job, action: (job: Job) => void) => {
    if (pending.current.has(job.url)) return;
    pending.current.add(job.url);
    action(job);
  };
  return {
    saveJob: (job: Job) => run(job, save.mutate),
    markApplied: (job: Job) => run(job, applied.mutate),
    isSaving: (job: Job) => pending.current.has(job.url),
    isUpdating: (job: Job) => pending.current.has(job.url),
    isSaved: (job: Job) => savedJobs.some((item) => item.url === job.url),
    isApplied: (job: Job) => savedJobs.some((item) => item.url === job.url && item.applied),
  };
}
