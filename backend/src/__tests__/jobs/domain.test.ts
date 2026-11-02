import { parseJobsPayload } from '../../jobs/domain';
import { buildCatalog, filterJobs, parseJobsQuery, sortJobs } from '../../jobs/query';
import { jobsToCsv, csvFileName } from '../../jobs/exportCsv';
import { job, payload } from './fixtures';

describe('jobs payload boundary', () => {
  it.each([null, [], {}, { jobs: [] }, { jobs: [], updatedAt: 'nonsense' }, { jobs: [], updatedAt: '2026-10-25', schemaVersion: 2 }])('rejects incompatible envelope %j', raw => {
    expect(() => parseJobsPayload(raw)).toThrow();
  });

  it('normalizes scalars/arrays, strips bidi, restricts enums and dictionary keys, and projects only Job fields', () => {
    const source = job() as unknown as Record<string, unknown>;
    Object.assign(source, { title: 'Soft\u202eware', location: 42, technologies: ['Type\u200fScript', {}], cities: ['Haifa', '__proto__', 'toString', 8],
      regions: ['north', 'constructor'], city: 'toString', region: '__proto__', workModel: 'constructor', seniority: 2,
      employmentType: '__proto__', job_category: 'constructor', provenance: { jobs: [job()] }, secret: 'hidden' });
    const result = parseJobsPayload({ ...payload(), secret: 'hidden', jobs: [source], cityLabels: JSON.parse('{"Haifa":"חי\\u200fפה","constructor":"bad","__proto__":"bad","N":7}') });
    expect(result.jobs[0]).toMatchObject({ title: 'Software', location: null, technologies: ['TypeScript'], cities: ['Haifa'],
      regions: ['north'], city: null, region: null, workModel: null, seniority: null, employmentType: null, job_category: 'other' });
    expect(result.jobs[0]).not.toHaveProperty('secret');
    expect(result.jobs[0]).not.toHaveProperty('provenance');
    expect(result).not.toHaveProperty('secret');
    expect(Object.keys(result.cityLabels!)).toEqual(['Haifa']);
    expect(result.cityLabels!.Haifa).toBe('חיפה');
  });

  it('drops invalid records and unsafe hrefs and recalculates count', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const result = parseJobsPayload({ ...payload(), count: 10, jobs: [null, [], {}, job({ url: 'javascript:alert(1)' }), job({ url: 'data:text/html,test' }), job()] });
    expect(result.count).toBe(1);
    expect(result.jobs).toHaveLength(1);
    expect(warn).toHaveBeenCalled();
  });
});

describe('jobs filtering and order', () => {
  const data = payload([
    job({ url: 'https://jobs.example.com/a', title: 'QA Engineer', company: 'Acme', job_category: 'qa', workModel: 'remote', seniority: 'junior', employmentType: 'part-time',
      cities: ['Tel Aviv', 'Haifa'], regions: ['tel-aviv-gush-dan', 'haifa-krayot'], technologies: ['Playwright'], department: 'Quality' }),
    job({ url: 'https://jobs.example.com/b', title: 'מהנדס תוכנה', company: 'Beta', refreshState: 'closed', cities: ['Jerusalem'], regions: ['jerusalem'], city: 'Jerusalem' }),
    job({ url: 'https://jobs.example.com/c', company: 'Acme' }),
  ]);
  const matching = (query: Record<string, unknown>) => filterJobs(data, parseJobsQuery(query).filters).map(item => item.url);

  it('hides closed jobs by default and includes them only on explicit true', () => {
    expect(matching({})).toHaveLength(2);
    expect(matching({ showClosed: 'true' })).toHaveLength(3);
  });

  it.each(['QA Engineer', 'acme', 'Quality', 'Haifa', 'חיפה', 'playwright', 'תל אביב'])('searches renderer fields and all canonical/Hebrew cities: %s', search => {
    expect(matching({ search })).toContain('https://jobs.example.com/a');
  });

  it('matches any selected value within one facet and combines facets with AND', () => {
    expect(matching({ company: ['Missing', 'Acme'], category: ['qa', 'design'], city: ['Haifa', 'Jerusalem'], region: 'haifa-krayot',
      workModel: 'remote', employmentType: 'part-time', seniority: 'junior' })).toEqual(['https://jobs.example.com/a']);
    expect(matching({ city: 'Haifa', region: 'jerusalem' })).toEqual([]);
    expect(matching({ company: 'acme' })).toEqual([]);
  });

  it('sorts English first, newest within language, invalid/undated last, and URL ties deterministically', () => {
    const jobs = [job({ title: 'מהנדס', updated: '2026-10-25', url: 'https://j/he' }), job({ updated: null, url: 'https://j/no' }),
      job({ updated: '2026-10-24', url: 'https://j/z' }), job({ updated: '2026-10-25', url: 'https://j/new' }),
      job({ updated: '2026-10-24', url: 'https://j/a' }), job({ updated: 'bad', url: 'https://j/invalid' })];
    const original = [...jobs];
    expect(sortJobs(jobs).map(item => item.url)).toEqual(['https://j/new', 'https://j/a', 'https://j/z', 'https://j/invalid', 'https://j/no', 'https://j/he']);
    expect(jobs).toEqual(original);
  });

  it.each(['0', '-1', '1.5', '1e2', 'Infinity', '', '9007199254740992', ['1', '2'], {}])('rejects invalid page %j', page => {
    expect(() => parseJobsQuery({ page })).toThrow();
  });

  it.each([{ search: ['a', 'b'] }, { showClosed: '1' }, { city: { city: 'Haifa' } }, { seniority: ['senior', 1] }])('rejects malformed filters %j', query => {
    expect(() => parseJobsQuery(query)).toThrow();
  });
});

describe('public catalog', () => {
  it('returns open-only aggregate summaries, all city facets, and no individual records', () => {
    const result = buildCatalog(payload([
      job({ title: 'SENSITIVE_TITLE', url: 'https://secret-url.example.com', description: 'SENSITIVE_DESCRIPTION', cities: ['Tel Aviv', 'Haifa', 'Haifa'] }),
      job({ company: 'Beta', cities: ['Haifa'], updated: '2026-10-25', department: 'Research', job_category: 'data-ai' }),
      job({ company: 'ClosedOnly', refreshState: 'closed', cities: ['Jerusalem'] }),
    ]), true);
    expect(result.stats).toEqual({ jobs: 2, companies: 2, cities: 2 });
    expect(result.facets.cities).toEqual(expect.arrayContaining(['Haifa', 'Tel Aviv', 'Jerusalem']));
    expect(result.stale).toBe(true);
    expect(result.companies).toHaveLength(2);
    expect(result.companies.find(item => item.name === 'Acme')).toMatchObject({ jobCount: 1, locations: ['Haifa', 'Tel Aviv'], categories: ['Engineering'], jobCategories: ['software'] });
    expect(result.cities.find(item => item.city === 'Haifa')).toMatchObject({ jobCount: 2, companies: ['Acme', 'Beta'] });
    const serialized = JSON.stringify(result);
    for (const secret of ['SENSITIVE_TITLE', 'secret-url', 'SENSITIVE_DESCRIPTION', '"jobs":[', '"url":', '"title":', '"description":']) expect(serialized).not.toContain(secret);
  });

  it('preserves real zero counts for empty feeds and excludes closed-only companies/cities', () => {
    expect(buildCatalog(payload([]), false).stats).toEqual({ jobs: 0, companies: 0, cities: 0 });
    const result = buildCatalog(payload([job({ refreshState: 'closed' })]), false);
    expect(result.stats).toEqual({ jobs: 0, companies: 0, cities: 0 });
    expect(result.companies).toEqual([]);
    expect(result.cities).toEqual([]);
    expect(result.facets.cities).toEqual(['Tel Aviv']);
  });
});

describe('CSV serialization', () => {
  it('preserves UTF-8 BOM, CRLF, Hebrew, quotes, multi-region cells and formula neutralization', () => {
    const csv = jobsToCsv([job({ title: ' =HYPERLINK("x")', company: 'Company,"Quoted"\nsecond', cityHe: 'חיפה', regions: ['north', 'haifa-krayot'] })]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('"\' =HYPERLINK(""x"")"');
    expect(csv).toContain('"Company,""Quoted""\nsecond"');
    expect(csv).toContain('חיפה,north; haifa-krayot');
    expect(csv.endsWith('\r\n')).toBe(true);
    expect(jobsToCsv([job({ title: '\t@SUM(1)' })])).toContain("'\t@SUM(1)");
  });

  it('dates filenames with the Israel calendar day', () => {
    expect(csvFileName(new Date('2026-06-01T22:30:00Z'))).toBe('techjobs-2026-06-02.csv');
  });
});
