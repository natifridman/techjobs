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
  const record = (job: Job) => ({
    job_title: job.title, company: job.company, category: job.department || undefined,
    city: displayCity(job), url: job.url, level: job.seniority || undefined, job_category: job.job_category,
  });
  const save = useMutation({
    mutationFn: async (job: Job) => {
      const existing = savedJobs.find(item => item.url === job.url);
      if (existing) await savedJobsApi.delete(existing.id, existing.url);
      else await savedJobsApi.create(record(job));
      return { job, removed: !!existing };
    },
    onSuccess: ({ job, removed }) => {
      void client.invalidateQueries({ queryKey: ['savedJobs'] });
      toast.success(removed ? 'Job removed from saved' : 'Job saved!');
      posthog.capture(removed ? 'job_unsaved' : 'job_saved', { job_title: job.title, company: job.company });
    },
    onError: () => toast.error('Could not update saved jobs. Please try again.'),
  });
  const applied = useMutation({
    mutationFn: async (job: Job) => {
      const existing = savedJobs.find(item => item.url === job.url);
      const next = !existing?.applied;
      const applied_date = next ? new Date().toISOString().split('T')[0] : undefined;
      if (existing) await savedJobsApi.update(existing.id, { applied: next, applied_date }, existing.url);
      else await savedJobsApi.create({ ...record(job), applied: true, applied_date });
      return { job, applied: next };
    },
    onSuccess: ({ job, applied }) => {
      void client.invalidateQueries({ queryKey: ['savedJobs'] });
      toast.success(applied ? 'Marked as applied!' : 'Unmarked as applied');
      posthog.capture(applied ? 'job_applied' : 'job_unapplied', { job_title: job.title, company: job.company });
    },
    onError: () => toast.error('Could not update the application status. Please try again.'),
  });
  return {
    saveJob: save.mutate, markApplied: applied.mutate,
    isSaved: (job: Job) => savedJobs.some(item => item.url === job.url),
    isApplied: (job: Job) => savedJobs.some(item => item.url === job.url && item.applied),
  };
}
