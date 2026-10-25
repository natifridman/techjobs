import { parseJobsPayload, type JobsPayload } from './domain';

export const JOBS_CACHE_TTL_MS = 5 * 60 * 1000;
export const JOBS_RETRY_DELAY_MS = 30 * 1000;
export const JOBS_READ_TIMEOUT_MS = 15 * 1000;
export class JobsUnavailable extends Error {}
export type JobsSnapshot = { payload: JobsPayload; stale: boolean };

export async function readPrivateJobsObject(): Promise<unknown> {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!base || !key) throw new Error('Missing private jobs storage configuration');
  const bucket = process.env.JOBS_STORAGE_BUCKET || 'jobs-feed';
  const object = process.env.JOBS_STORAGE_OBJECT || 'jobs.json';
  if (object.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Invalid jobs storage object');
  const endpoint = new URL(base);
  if (endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname))) {
    throw new Error('Invalid private jobs storage endpoint');
  }
  const storage = `${endpoint.href.replace(/\/+$/, '')}/storage/v1`;
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  // One abort deadline bounds bucket inspection, download and body reading.
  // Native fetch exposes cancellation, which Storage getBucket does not.
  const signal = AbortSignal.timeout(JOBS_READ_TIMEOUT_MS);
  // Refuse misconfiguration instead of silently turning the full feed public.
  const metadataResponse = await fetch(`${storage}/bucket/${encodeURIComponent(bucket)}`, { headers, signal, redirect: 'error' });
  if (!metadataResponse.ok) throw new Error('Cannot inspect private jobs storage bucket');
  const metadata = await metadataResponse.json();
  if (!metadata || typeof metadata !== 'object' || !('public' in metadata) || metadata.public !== false) {
    throw new Error('Jobs storage bucket must exist and be private');
  }
  const path = object.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(`${storage}/object/authenticated/${encodeURIComponent(bucket)}/${path}`, { headers, signal, redirect: 'error' });
  if (!response.ok) throw new Error('Failed to download private jobs feed');
  return response.json();
}

export function createJobsService(
  read: () => Promise<unknown> = readPrivateJobsObject,
  now: () => number = Date.now,
  ttlMs = JOBS_CACHE_TTL_MS,
) {
  let cached: { payload: JobsPayload; loadedAt: number } | null = null;
  let inflight: Promise<JobsSnapshot> | null = null;
  let retryAt = 0;
  return {
    getSnapshot(): Promise<JobsSnapshot> {
      if (cached && now() - cached.loadedAt < ttlMs) return Promise.resolve({ payload: cached.payload, stale: false });
      if (cached && now() < retryAt) return Promise.resolve({ payload: cached.payload, stale: true });
      if (!inflight) {
        inflight = (async () => {
          try {
            const payload = parseJobsPayload(await read());
            cached = { payload, loadedAt: now() };
            retryAt = 0;
            return { payload, stale: false };
          } catch {
            // Never include upstream URLs, keys, or payloads in public errors.
            console.warn('Jobs feed refresh failed; serving last validated snapshot when available');
            if (cached) {
              retryAt = now() + JOBS_RETRY_DELAY_MS;
              return { payload: cached.payload, stale: true };
            }
            throw new JobsUnavailable('Jobs are temporarily unavailable');
          }
        })().finally(() => { inflight = null; });
      }
      return inflight;
    },
  };
}

export const jobsService = createJobsService();
