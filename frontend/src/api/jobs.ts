import { parseJobsPayload, type Job } from '@/components/jobs/jobsData';

const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '').replace(/\/api$/, '');
const API_BASE_URL = `${API_ORIGIN}/api`;

export interface JobsQuery {
  search?: string;
  company?: string;
  category?: string[];
  city?: string[];
  region?: string[];
  workModel?: string[];
  employmentType?: string[];
  seniority?: string[];
  showClosed?: boolean;
  page?: number;
}

export interface JobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  pageSize: number;
  access: 'guest' | 'authenticated';
  previewLimit: number | null;
  requiresAuth: boolean;
  updatedAt: string;
  stale: boolean;
}

export interface CatalogCompany {
  name: string;
  jobCount: number;
  categories: string[];
  locations: string[];
  jobCategories: string[];
  latestUpdate: string | null;
}

export interface JobsCatalog {
  updatedAt: string;
  stale: boolean;
  stats: { jobs: number; companies: number; cities: number };
  cityLabels: Record<string, string>;
  facets: { cities: string[] };
  companies: CatalogCompany[];
  cities: { city: string; jobCount: number; companies: string[] }[];
}

export class JobsApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'JobsApiError';
    this.status = status;
    this.code = code;
  }
}

/** Stable parameter order and sorted, deduplicated facets also identify cache entries. */
export function jobsQueryParams(query: JobsQuery, includePage = true): URLSearchParams {
  const params = new URLSearchParams();
  if (query.search?.trim()) params.set('search', query.search.trim());
  if (query.company?.trim()) params.set('company', query.company.trim());
  for (const key of ['category', 'city', 'region', 'workModel', 'employmentType', 'seniority'] as const) {
    for (const value of [...new Set(query[key] || [])].filter(Boolean).sort()) params.append(key, value);
  }
  if (query.showClosed) params.set('showClosed', 'true');
  if (includePage && query.page && query.page > 1) params.set('page', String(Math.floor(query.page)));
  return params;
}

async function checkedFetch(path: string, signal?: AbortSignal): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}${path}`, { credentials: 'include', cache: 'no-store', signal });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new JobsApiError(body?.error || 'Jobs could not be loaded. Please try again.', response.status, body?.code);
  }
  return response;
}

export async function fetchJobs(query: JobsQuery = {}, signal?: AbortSignal): Promise<JobsResponse> {
  const response = await checkedFetch(`/jobs?${jobsQueryParams(query)}`, signal);
  const raw = await response.json();
  if (!raw || !['guest', 'authenticated'].includes(raw.access) || !Number.isFinite(raw.total)
    || !Number.isFinite(raw.page) || !Number.isFinite(raw.pageSize)) {
    throw new Error('Incompatible jobs response');
  }
  // Preserve the established field, URL and bidi validation at the API boundary.
  const { jobs } = parseJobsPayload(raw);
  return { ...raw, jobs };
}

export async function fetchJobsCatalog(signal?: AbortSignal): Promise<JobsCatalog> {
  const response = await checkedFetch('/jobs/catalog', signal);
  const raw = await response.json();
  if (!raw?.stats || !Array.isArray(raw.companies) || !Array.isArray(raw.cities)
    || !Array.isArray(raw.facets?.cities)) throw new Error('Incompatible jobs catalog');
  return raw;
}

export async function exportJobsCsv(query: JobsQuery, signal?: AbortSignal): Promise<Blob> {
  const response = await checkedFetch(`/jobs/export?${jobsQueryParams(query, false)}`, signal);
  return response.blob();
}
