import { parseJobsPayload, type Job, type JobsPayload } from '../../jobs/domain';

export function job(overrides: Partial<Job> = {}): Job {
  return {
    company: 'Acme', title: 'Software Engineer', location: 'Tel Aviv, Israel', url: 'https://jobs.example.com/1',
    city: 'Tel Aviv', department: 'Engineering', description: 'Private description', employmentType: 'full-time',
    workModel: 'hybrid', seniority: 'senior', technologies: ['TypeScript'], postedAt: '2026-10-24T10:00:00Z',
    firstSeenAt: '2026-10-24T10:00:00Z', closedAt: null, refreshState: 'active', region: 'tel-aviv-gush-dan',
    cities: ['Tel Aviv'], regions: ['tel-aviv-gush-dan'], cityHe: 'תל אביב', job_category: 'software',
    updated: '2026-10-24T10:00:00Z', ...overrides,
  };
}

export function payload(jobs: Job[] = []): JobsPayload {
  return parseJobsPayload({ schemaVersion: 1, updatedAt: '2026-10-25T10:00:00Z', count: jobs.length,
    cityLabels: { 'Tel Aviv': 'תל אביב', Haifa: 'חיפה', Jerusalem: 'ירושלים' }, jobs });
}

export function manyJobs(count: number): Job[] {
  return Array.from({ length: count }, (_, i) => job({ title: `Engineer ${i}`, url: `https://jobs.example.com/${String(i).padStart(3, '0')}` }));
}
