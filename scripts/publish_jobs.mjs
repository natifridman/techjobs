#!/usr/bin/env node
// Run: npm --prefix backend run publish:jobs -- /path/to/jobs.json
// This command validates first and only uploads to an existing private bucket.
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);

export function validatePublishingPayload(raw) {
  let parseJobsPayload;
  try {
    ({ parseJobsPayload } = require('../backend/dist/jobs/domain.js'));
  } catch {
    throw new Error('Build the backend first, or use npm --prefix backend run publish:jobs -- /path/to/jobs.json');
  }
  const payload = parseJobsPayload(raw);
  if (raw.schemaVersion !== 1 || !Number.isSafeInteger(raw.count) || raw.count !== raw.jobs.length || payload.jobs.length !== raw.jobs.length) {
    throw new Error('Publishing requires schemaVersion 1, a matching count, and valid job records');
  }
  return payload;
}

export async function publishJobs({ inputPath, env = process.env, fetchImpl = fetch } = {}) {
  if (!inputPath) throw new Error('Usage: npm --prefix backend run publish:jobs -- /path/to/jobs.json');
  // Validate before making any network request. Reuse the API parser so the
  // stored feed follows the same normalization and public Job projection.
  const payload = validatePublishingPayload(JSON.parse(await fs.readFile(inputPath, 'utf8')));
  const base = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_KEY;
  if (!base || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  const endpoint = new URL(base);
  if (endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname))) {
    throw new Error('SUPABASE_URL must use HTTPS (HTTP is allowed only for localhost)');
  }
  const bucket = env.JOBS_STORAGE_BUCKET || 'jobs-feed';
  const object = env.JOBS_STORAGE_OBJECT || 'jobs.json';
  if (!bucket || !object || object.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Invalid jobs storage bucket/object');
  const storage = `${endpoint.href.replace(/\/+$/, '')}/storage/v1`;
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const bucketResponse = await fetchImpl(`${storage}/bucket/${encodeURIComponent(bucket)}`, { headers, redirect: 'error' });
  if (!bucketResponse.ok) throw new Error(`Cannot inspect jobs storage bucket (${bucketResponse.status})`);
  const metadata = await bucketResponse.json();
  if (!metadata || metadata.public !== false) throw new Error('Refusing to publish: jobs storage bucket must be private');
  const encodedObject = object.split('/').map(encodeURIComponent).join('/');
  const response = await fetchImpl(`${storage}/object/${encodeURIComponent(bucket)}/${encodedObject}`, {
    method: 'POST', redirect: 'error',
    headers: { ...headers, 'Content-Type': 'application/json', 'x-upsert': 'true', 'cache-control': 'no-store' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Jobs feed upload failed (${response.status})`);
  return { bucket, object, count: payload.count, updatedAt: payload.updatedAt };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await publishJobs({ inputPath: process.argv[2] });
    console.log(`Published ${result.count} jobs to private ${result.bucket}/${result.object} (${result.updatedAt})`);
  } catch (error) {
    // Do not print fetch response bodies, URLs, environment values or keys.
    console.error(`Jobs publish failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exitCode = 1;
  }
}
