import { describe, it, expect } from 'vitest';
import { parseJobsPayload, selectSortedJobs, isClosed, isNewToday, type Job } from '@/components/jobs/jobsData';

let fixture: unknown;
const parseFixture = () => parseJobsPayload(fixture);
const sortedFixture = () => selectSortedJobs(parseFixture());

describe('parseJobsPayload normalization', () => {
  it('fills missing arrays so renderers never throw', async () => {
    fixture = {
      schemaVersion: 1, updatedAt: '2026-10-17T00:00:00Z', count: 2,
      jobs: [
        { company: 'A', title: 'Engineer', url: 'https://x/1', job_category: 'software' }, // no technologies/cities/regions
        { company: 'B', title: 'מהנדס', url: 'https://x/2', job_category: 'software', technologies: null, cities: 'tel-aviv' },
      ],
    };
    const payload = await parseFixture();
    expect(payload.jobs[0].technologies).toEqual([]);
    expect(payload.jobs[0].cities).toEqual([]);
    expect(payload.jobs[1].technologies).toEqual([]);
    expect(payload.jobs[1].cities).toEqual([]);
  });

  it('neutralizes prototype-polluting values in renderer lookup keys', async () => {
    // '__proto__' passes string validation but resolves through
    // Object.prototype in workModelIcons / CATEGORY_LABELS / cityLabels
    // lookups and crashes React. The boundary must coerce it away.
    fixture = {
      schemaVersion: 1,
      cityLabels: { 'Tel Aviv': 'תל אביב' },
      jobs: [{
        company: 'A', title: 'Engineer', url: 'https://x/1',
        job_category: '__proto__', workModel: '__proto__', seniority: '__proto__',
        employmentType: 'full-time', region: '__proto__',
        cities: ['__proto__', 'Tel Aviv'], regions: ['__proto__', 'center'], technologies: [],
      }],
    };
    const payload = await parseFixture();
    const job = payload.jobs[0];
    expect(job.job_category).toBe('other');
    expect(job.workModel).toBeNull();
    expect(job.seniority).toBeNull();
    expect(job.employmentType).toBe('full-time');
    expect(job.region).toBeNull();
    expect(job.cities).toEqual(['Tel Aviv']);
    expect(job.regions).toEqual(['center']);
  });

  it('neutralizes an unsafe singular city before dictionary lookups', async () => {
    fixture = {
      schemaVersion: 1,
      jobs: [{
        company: 'A', title: 'Engineer', url: 'https://x/1', job_category: 'software',
        city: 'constructor', cities: [], regions: [], technologies: [],
      }],
    };
    const payload = await parseFixture();
    expect(payload.jobs[0].city).toBeNull();
  });

  it('rejects a structurally incompatible payload instead of an empty board', async () => {
    fixture = {};
    expect(() => sortedFixture()).toThrow('missing jobs array');
  });

  it('rejects an unsupported schema version', async () => {
    fixture = { schemaVersion: 2, jobs: [] };
    expect(() => parseFixture()).toThrow('schemaVersion');
  });

  it('drops records missing required renderer fields instead of crashing JobCard', async () => {
    fixture = {
      schemaVersion: 1,
      jobs: [
        { company: 'A', title: 'Engineer', url: 'https://x/1' }, // no job_category
        { company: 'B', title: 'Designer', url: 'https://x/2', job_category: 'design' },
        null,
      ],
    };
    const jobs = await sortedFixture();
    expect(jobs).toHaveLength(1);
    expect(jobs[0].company).toBe('B');
  });

  it('normalizes malformed optional fields instead of crashing renderers', async () => {
    fixture = {
      schemaVersion: 1,
      jobs: [
        { company: 'A', title: 'Engineer', url: 'https://x/1', job_category: 'software', employmentType: 7, technologies: [{ name: 'React' }], cities: ['Tel Aviv', 42] },
      ],
    };
    const [job] = await sortedFixture();
    expect(job.employmentType).toBeNull();
    expect(job.technologies).toEqual([]);
    expect(job.cities).toEqual(['Tel Aviv']);
  });

  it('drops malformed cityLabels values at the boundary', async () => {
    fixture = {
      schemaVersion: 1,
      cityLabels: { Haifa: { he: 'חיפה' }, 'Tel Aviv': 'תל אביב' },
      jobs: [],
    };
    const payload = await parseFixture();
    expect(payload.cityLabels).toEqual({ 'Tel Aviv': 'תל אביב' });
  });

  it('does not mutate the shared payload when sorting', async () => {
    const payload = {
      schemaVersion: 1,
      jobs: [
        { company: 'A', title: 'Old Engineer', url: 'https://x/1', job_category: 'software', updated: '2026-01-01' },
        { company: 'B', title: 'New Engineer', url: 'https://x/2', job_category: 'software', updated: '2026-10-17' },
      ],
    };
    fixture = payload;
    const sorted = await sortedFixture();
    const again = await parseFixture();
    expect(sorted[0].company).toBe('B');
    // cached payload keeps its published order
    expect(again.jobs[0].company).toBe('A');
  });
});

describe('sortJobs ordering', () => {
  it('sorts English titles first, then newest; undated last within group', async () => {
    fixture = {
      jobs: [
        { company: 'A', title: 'מהנדס תוכנה', url: 'https://x/1', job_category: 'software', updated: '2026-10-17' },
        { company: 'B', title: 'Old Engineer', url: 'https://x/2', job_category: 'software', updated: '2026-01-01' },
        { company: 'C', title: 'New Engineer', url: 'https://x/3', job_category: 'software', updated: '2026-10-17' },
        { company: 'D', title: 'Undated Engineer', url: 'https://x/4', job_category: 'software', updated: null },
      ],
    };
    const titles = (await sortedFixture()).map(j => j.title);
    expect(titles).toEqual(['New Engineer', 'Old Engineer', 'Undated Engineer', 'מהנדס תוכנה']);
  });
});

describe('freshness helpers', () => {
  const base = { company: 'A', title: 'Engineer', url: 'https://x/1', job_category: 'software' } as Job;

  it('isClosed flags closed tombstones only', () => {
    expect(isClosed({ ...base, refreshState: 'closed', closedAt: '2026-10-17T00:00:00Z' })).toBe(true);
    expect(isClosed({ ...base, refreshState: 'fresh', closedAt: null })).toBe(false);
    expect(isClosed({ ...base, refreshState: null, closedAt: null })).toBe(false);
  });

  it('isNewToday is anchored to the Asia/Jerusalem calendar day', () => {
    const now = new Date();
    expect(isNewToday({ ...base, firstSeenAt: now.toISOString() })).toBe(true);
    expect(isNewToday({ ...base, firstSeenAt: '2020-01-01T00:00:00Z' })).toBe(false);
    expect(isNewToday({ ...base, firstSeenAt: null })).toBe(false);
    expect(isNewToday({ ...base, firstSeenAt: 'not-a-date' })).toBe(false);
  });
});

describe('adversarial payload hardening', () => {
  it('strips bidi control characters from titles, optional fields, arrays and city labels', async () => {
    fixture = {
      schemaVersion: 1,
      cityLabels: { 'Tel Aviv': 'תל אביב\u202E!' },
      jobs: [{
        company: 'A', title: 'Senior \u202EEngineer', url: 'https://x/1', job_category: 'software',
        city: 'Tel\u200FAviv', technologies: ['Re\u202Dact'], cities: ['Tel Aviv'], regions: [],
      }],
    };
    const payload = await parseFixture();
    expect(payload.jobs[0].title).toBe('Senior Engineer');
    expect(payload.jobs[0].city).toBe('TelAviv');
    expect(payload.jobs[0].technologies).toEqual(['React']);
    expect(payload.cityLabels?.['Tel Aviv']).toBe('תל אביב!');
  });

  it('accepts an empty feed without error', async () => {
    fixture = { schemaVersion: 1, jobs: [] };
    const payload = await parseFixture();
    expect(payload.jobs).toEqual([]);
  });

  it('survives prototype-pollution-shaped and giant-string records', async () => {
    const giant = 'x'.repeat(200_000);
    fixture = {
      schemaVersion: 1,
      jobs: [
        JSON.parse('{ "company": "A", "title": "T", "url": "https://x/1", "job_category": "software", "__proto__": { "polluted": true } }'),
        { company: 'B', title: giant, url: 'https://x/2', job_category: 'software', technologies: Array(5000).fill('t') },
      ],
    };
    const payload = await parseFixture();
    expect(payload.jobs).toHaveLength(2);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(payload.jobs[1].title).toHaveLength(200_000);
  });
});
