import { CATEGORY_LABELS, REGION_LABELS } from './jobsData';
import type { JobsQuery } from '@/api/jobs';

export interface Filters {
  search: string;
  jobCategories: string[];
  workModels: string[];
  employmentTypes: string[];
  seniorities: string[];
  cities: string[];
  regions: string[];
  showClosed: boolean;
}

export const EMPTY_FILTERS: Filters = {
  search: '', jobCategories: [], workModels: [], employmentTypes: [], seniorities: [],
  cities: [], regions: [], showClosed: false,
};

export const WORK_MODELS = ['remote', 'hybrid', 'on-site'];
export const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'student', 'intern', 'temp', 'contract'];
export const SENIORITIES = ['intern', 'junior', 'senior', 'staff', 'principal', 'lead', 'manager'];
export type ListFilter = keyof Omit<Filters, 'search' | 'showClosed'>;

export function readJobsFilters(params: URLSearchParams, cities?: string[]) {
  const values = (key: string, allowed?: string[]) => [...new Set(params.getAll(key))]
    .filter(value => value && (!allowed || allowed.includes(value))).sort();
  const pageValue = params.get('page') || '1';
  const page = /^\d+$/.test(pageValue) && Number.isSafeInteger(Number(pageValue)) && Number(pageValue) > 0
    ? Number(pageValue) : 1;
  const filters: Filters = {
    search: params.get('search') || '',
    jobCategories: values('category', Object.keys(CATEGORY_LABELS)),
    cities: values('city', cities),
    regions: values('region', Object.keys(REGION_LABELS)),
    workModels: values('workModel', WORK_MODELS),
    employmentTypes: values('employmentType', EMPLOYMENT_TYPES),
    seniorities: values('seniority', SENIORITIES),
    showClosed: params.get('showClosed') === 'true',
  };
  return { filters, page, company: params.get('company')?.trim() || '' };
}

export function filtersToQuery(filters: Filters, page = 1, company = ''): JobsQuery {
  return {
    search: filters.search, category: filters.jobCategories, city: filters.cities,
    region: filters.regions, workModel: filters.workModels, employmentType: filters.employmentTypes,
    seniority: filters.seniorities, showClosed: filters.showClosed, page, company,
  };
}

export function activeFilterCount(filters: Filters): number {
  return filters.jobCategories.length + filters.workModels.length + filters.employmentTypes.length
    + filters.seniorities.length + filters.cities.length + filters.regions.length + Number(filters.showClosed);
}
