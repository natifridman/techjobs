import type { Job, JobsPayload } from './domain';
import { isClosed } from './domain';

export interface JobsFilters {
  search: string;
  company: string[];
  category: string[];
  city: string[];
  region: string[];
  workModel: string[];
  employmentType: string[];
  seniority: string[];
  showClosed: boolean;
}

export class InvalidJobsQuery extends Error {}

// Only these values affect access and filtering. Unknown parameters, including
// forged limit/offset/access values, cannot alter server-side pagination.
export function parseJobsQuery(query: Record<string, unknown>): { filters: JobsFilters; page: number } {
  const single = (key: string, fallback = ''): string => {
    const value = query[key];
    if (value === undefined) return fallback;
    if (typeof value !== 'string') throw new InvalidJobsQuery(`Invalid ${key}`);
    return value;
  };
  const multiple = (key: string): string[] => {
    const value = query[key];
    if (value === undefined) return [];
    if (typeof value === 'string') return value ? [value] : [];
    if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
      return [...new Set(value.filter(Boolean))];
    }
    throw new InvalidJobsQuery(`Invalid ${key}`);
  };
  const rawPage = single('page', '1');
  if (!/^[1-9]\d*$/.test(rawPage) || !Number.isSafeInteger(Number(rawPage))) {
    throw new InvalidJobsQuery('page must be a positive integer');
  }
  const showClosed = single('showClosed', 'false');
  if (showClosed !== 'true' && showClosed !== 'false') {
    throw new InvalidJobsQuery('showClosed must be true or false');
  }
  return {
    page: Number(rawPage),
    filters: {
      search: single('search'), company: multiple('company'), category: multiple('category'),
      city: multiple('city'), region: multiple('region'), workModel: multiple('workModel'),
      employmentType: multiple('employmentType'), seniority: multiple('seniority'),
      showClosed: showClosed === 'true',
    },
  };
}

const time = (value: string | null): number => value && Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0;
const compareText = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;

export function sortJobs(jobs: Job[]): Job[] {
  const language = (title: string): number => {
    const first = title.match(/[A-Za-zא-ת]/);
    return first && /[א-ת]/.test(first[0]) ? 1 : 0;
  };
  return [...jobs].sort((a, b) => language(a.title) - language(b.title) || time(b.updated) - time(a.updated) || compareText(a.url, b.url));
}

export function filterJobs(payload: JobsPayload, filters: JobsFilters): Job[] {
  const search = filters.search.toLowerCase();
  const labels = payload.cityLabels || {};
  const includes = (selected: string[], value: string | null) => selected.length === 0 || (value !== null && selected.includes(value));
  return sortJobs(payload.jobs.filter(job => {
    if (!filters.showClosed && isClosed(job)) return false;
    if (search && !(
      [job.title, job.company, job.department, job.city, job.job_category].some(value => value?.toLowerCase().includes(search)) ||
      job.cityHe?.includes(filters.search) ||
      job.cities.some(city => city.toLowerCase().includes(search) || (labels[city] || '').toLowerCase().includes(search)) ||
      job.technologies.some(value => value.toLowerCase().includes(search))
    )) return false;
    return includes(filters.company, job.company) && includes(filters.category, job.job_category) &&
      includes(filters.workModel, job.workModel) && includes(filters.employmentType, job.employmentType) &&
      includes(filters.seniority, job.seniority) &&
      (filters.city.length === 0 || job.cities.some(city => filters.city.includes(city))) &&
      (filters.region.length === 0 || job.regions.some(region => filters.region.includes(region)));
  }));
}

export interface JobsCatalog {
  updatedAt: string;
  stale: boolean;
  stats: { jobs: number; companies: number; cities: number };
  cityLabels: Record<string, string>;
  facets: { cities: string[] };
  companies: Array<{ name: string; jobCount: number; categories: string[]; locations: string[]; jobCategories: string[]; latestUpdate: string | null }>;
  cities: Array<{ city: string; jobCount: number; companies: string[] }>;
}

export function buildCatalog(payload: JobsPayload, stale: boolean): JobsCatalog {
  const open = payload.jobs.filter(job => !isClosed(job));
  const companyMap = new Map<string, JobsCatalog['companies'][number]>();
  const cityMap = new Map<string, JobsCatalog['cities'][number]>();
  const allCities = new Set(payload.jobs.flatMap(job => job.cities));
  const addUnique = (items: string[], item: string | null) => { if (item && !items.includes(item)) items.push(item); };
  for (const job of open) {
    const name = job.company.trim();
    if (name) {
      let company = companyMap.get(name);
      if (!company) {
        company = { name, jobCount: 0, categories: [], locations: [], jobCategories: [], latestUpdate: null };
        companyMap.set(name, company);
      }
      company.jobCount++;
      addUnique(company.categories, job.department);
      addUnique(company.jobCategories, job.job_category);
      for (const city of job.cities.length ? job.cities : job.city ? [job.city] : []) addUnique(company.locations, city);
      if (time(job.updated) > time(company.latestUpdate)) company.latestUpdate = job.updated;
    }
    for (const city of new Set(job.cities)) {
      let entry = cityMap.get(city);
      if (!entry) { entry = { city, jobCount: 0, companies: [] }; cityMap.set(city, entry); }
      entry.jobCount++;
      addUnique(entry.companies, name);
    }
  }
  const labels = payload.cityLabels || {};
  const byCity = (a: string, b: string) => (labels[a] || a).localeCompare(labels[b] || b);
  const companies = [...companyMap.values()].map(company => ({
    ...company, categories: company.categories.sort(compareText), locations: company.locations.sort(byCity), jobCategories: company.jobCategories.sort(compareText),
  })).sort((a, b) => b.jobCount - a.jobCount || compareText(a.name, b.name));
  const cities = [...cityMap.values()].map(city => ({ ...city, companies: city.companies.sort(compareText) }))
    .sort((a, b) => b.jobCount - a.jobCount || byCity(a.city, b.city));
  return { updatedAt: payload.updatedAt, stale, stats: { jobs: open.length, companies: companyMap.size, cities: cityMap.size },
    cityLabels: labels, facets: { cities: [...allCities].sort(byCity) }, companies, cities };
}
