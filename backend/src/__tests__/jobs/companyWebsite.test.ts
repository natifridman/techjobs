import { companyWebsite } from '../../jobs/companyWebsite';
import { buildCatalog } from '../../jobs/query';
import { job, payload } from './fixtures';
import homepages from '../../jobs/companyHomepages.json';

describe('corporate company websites', () => {
  it('keeps the verified mappings limited to homepages, without recruiting paths or query data', () => {
    for (const homepage of Object.values(homepages)) {
      if (homepage === null) continue;
      const url = new URL(homepage);
      expect(['https:', 'http:']).toContain(url.protocol);
      expect(url.pathname).toBe('/');
      expect(url.search).toBe('');
      expect(url.hash).toBe('');
      expect(url.username).toBe('');
      expect(url.hostname).not.toMatch(/(^|\.)(comeet\.com|greenhouse\.io|lever\.co|ashbyhq\.com|myworkdayjobs\.com|workable\.com)$/);
    }
  });

  it.each([
    ['https://careers.acme.co.il/jobs/123?source=board#apply', 'https://acme.co.il/'],
    ['https://jobs.acme.com/en/job/private-title/123', 'https://acme.com/'],
    ['https://www.acme.com/careers/123', 'https://www.acme.com/'],
    ['http://acme.com/job/123', 'http://acme.com/'],
  ])('derives the corporate homepage from %s without job details', (url, expected) => {
    expect(companyWebsite('New employer', url)).toBe(expected);
  });

  it.each([
    ['Nvidia', 'https://nvidia.wd5.myworkdayjobs.com/en-US/Careers/job/123', 'https://nvidia.com/'],
    ['AKEYLESS', 'https://www.comeet.com/jobs/akeyless/27.006/engineer/123', 'https://akeyless.io/'],
    ['Mobileye', 'https://jobs.eu.lever.co/mobileye/123', 'https://mobileye.com/'],
    ['Elbit Systems', 'https://elbitsystemscareer.com/job/?jid=123', 'https://elbitsystems.com/'],
    ['Amazon', 'https://www.amazon.jobs/jobs/123', 'https://amazon.com/'],
    ['Microsoft', 'https://microsoftrnd.co.il/jobs/123', 'https://microsoft.com/'],
  ])('uses %s’s verified corporate homepage instead of its recruiting site', (name, url, expected) => {
    expect(companyWebsite(name, url)).toBe(expected);
  });

  it.each([
    'https://www.comeet.com/jobs/new-employer/AB.123/engineer/123',
    'https://job-boards.greenhouse.io/newemployer/jobs/123',
    'https://newemployer.wd5.myworkdayjobs.com/jobs/123',
    'https://jobs.lever.co/newemployer/123',
    'https://jobs.ashbyhq.com/newemployer/123',
    'https://apply.workable.com/j/123',
    'https://jobs.gem.com/newemployer/123',
    'https://jobs.jobvite.com/newemployer/job/123',
    'https://team8.vc/career/new-employer/123',
    'https://newemployer.webflow.io/careers/123',
  ])('never sends an unknown company to the shared host of %s', url => {
    expect(companyWebsite('New employer', url)).toBeNull();
  });

  it.each(['not a URL', '/jobs/123', 'javascript:alert(1)', 'ftp://acme.com/jobs', 'https://127.0.0.1/job', 'https://user:password@acme.com/job'])('rejects an unsafe job URL %s', url => {
    expect(companyWebsite('New employer', url)).toBeNull();
  });

  it('leaves an unidentified employer without an invented corporate homepage', () => {
    expect(companyWebsite('Cyber start up', 'https://team8.vc/career/cyber-start-up/123')).toBeNull();
  });

  it('adds websites for multiple companies without changing job counts or exposing listings', () => {
    const result = buildCatalog(payload([
      job({ company: 'New employer', url: 'https://jobs.acme.co.il/jobs/secret-123' }),
      job({ company: 'Nvidia', url: 'https://nvidia.wd5.myworkdayjobs.com/en-US/Careers/job/private-456' }),
      job({ company: 'AKEYLESS', url: 'https://www.comeet.com/jobs/akeyless/27.006/secret-789' }),
      job({ company: 'New employer', url: 'https://jobs.acme.co.il/jobs/closed-123', refreshState: 'closed' }),
    ]), false);
    expect(result.stats.jobs).toBe(3);
    expect(result.companies).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'New employer', jobCount: 1, websiteUrl: 'https://acme.co.il/' }),
      expect.objectContaining({ name: 'Nvidia', jobCount: 1, websiteUrl: 'https://nvidia.com/' }),
      expect.objectContaining({ name: 'AKEYLESS', jobCount: 1, websiteUrl: 'https://akeyless.io/' }),
    ]));
    expect(JSON.stringify(result)).not.toMatch(/secret-123|private-456|secret-789|closed-123/);
  });

  it('can use another company job when the first link has no known corporate homepage', () => {
    const result = buildCatalog(payload([
      job({ company: 'New employer', url: 'https://jobs.lever.co/newemployer/123' }),
      job({ company: 'New employer', url: 'https://careers.acme.co.il/jobs/456' }),
    ]), false);
    expect(result.companies[0]).toMatchObject({ jobCount: 2, websiteUrl: 'https://acme.co.il/' });
  });
});
