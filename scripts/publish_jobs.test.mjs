import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { publishJobs, validatePublishingPayload } from './publish_jobs.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
let temp;
const env = { SUPABASE_URL: 'https://private-project.example.com', SUPABASE_SERVICE_KEY: 'test-secret-service-key' };
const source = () => ({ schemaVersion: 1, updatedAt: '2026-10-25T10:00:00Z', count: 1,
  cityLabels: { Haifa: 'חיפה' }, jobs: [{ company: 'Acme', title: 'Engineer', url: 'https://j.example.com/1', job_category: 'software' }] });

before(async () => {
  // Exercise exactly the built domain parser used by the publishing command.
  execFileSync(process.execPath, ['backend/node_modules/typescript/bin/tsc', '--project', 'backend/tsconfig.json'], { cwd: projectRoot, stdio: 'pipe' });
  temp = await fs.mkdtemp(path.join(os.tmpdir(), 'techjobs-publish-'));
});
after(async () => { await fs.rm(temp, { recursive: true, force: true }); });

async function input(payload = source()) {
  const filename = path.join(temp, `${Math.random().toString(16).slice(2)}.json`);
  await fs.writeFile(filename, JSON.stringify(payload));
  return filename;
}

test('publisher reuses normalization and projects only the public Job contract', () => {
  const raw = source();
  raw.jobs[0].title = 'Eng\u202eineer';
  raw.jobs[0].provenance = { credentials: 'not-for-browsers' };
  raw.extra = 'not-for-browsers';
  const result = validatePublishingPayload(raw);
  assert.equal(result.jobs[0].title, 'Engineer');
  assert.equal(result.jobs[0].description, null);
  assert.equal(result.jobs[0].provenance, undefined);
  assert.equal(result.extra, undefined);
});

test('publisher rejects version/count/record errors before making network requests', async () => {
  const bad = [
    { ...source(), schemaVersion: 2 }, { ...source(), schemaVersion: undefined }, { ...source(), count: 99 },
    { ...source(), updatedAt: 'bad' }, { ...source(), jobs: [{ ...source().jobs[0], url: 'javascript:alert(1)' }] },
  ];
  for (const payload of bad) {
    let calls = 0;
    await assert.rejects(publishJobs({ inputPath: await input(payload), env, fetchImpl: async () => { calls++; } }));
    assert.equal(calls, 0);
  }
});

test('publisher refuses public, missing-privacy, and uninspectable buckets without upload', async () => {
  for (const metadata of [{ public: true }, {}, null]) {
    const calls = [];
    await assert.rejects(publishJobs({ inputPath: await input(), env, fetchImpl: async (...args) => {
      calls.push(args); return { ok: true, json: async () => metadata };
    } }));
    assert.equal(calls.length, 1);
  }
  await assert.rejects(publishJobs({ inputPath: await input(), env, fetchImpl: async () => ({ ok: false, status: 404 }) }), /Cannot inspect/);
});

test('publisher uploads validated JSON with service authentication, default object, and upsert', async () => {
  const calls = [];
  const result = await publishJobs({ inputPath: await input(), env, fetchImpl: async (url, options) => {
    calls.push({ url, options });
    return calls.length === 1 ? { ok: true, json: async () => ({ public: false }) } : { ok: true };
  } });
  assert.equal(result.bucket, 'jobs-feed');
  assert.equal(result.object, 'jobs.json');
  assert.equal(result.count, 1);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, 'https://private-project.example.com/storage/v1/bucket/jobs-feed');
  assert.equal(calls[1].url, 'https://private-project.example.com/storage/v1/object/jobs-feed/jobs.json');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer test-secret-service-key');
  assert.equal(calls[1].options.headers['x-upsert'], 'true');
  assert.equal(calls[1].options.headers['Content-Type'], 'application/json');
  assert.equal(calls[1].options.redirect, 'error');
  assert.deepEqual(JSON.parse(calls[1].options.body), validatePublishingPayload(source()));
});

test('publisher supports custom names and refuses failed uploads without response-body leakage', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return calls.length === 1 ? { ok: true, json: async () => ({ public: false }) } : { ok: false, status: 503 };
  };
  await assert.rejects(publishJobs({ inputPath: await input(), env: { ...env, JOBS_STORAGE_BUCKET: 'private feed', JOBS_STORAGE_OBJECT: 'daily/current feed.json' }, fetchImpl }), /upload failed \(503\)/);
  assert.equal(calls[1].url, 'https://private-project.example.com/storage/v1/object/private%20feed/daily/current%20feed.json');
});

test('publisher requires a file and credentials and refuses remote plaintext HTTP and traversal objects', async () => {
  await assert.rejects(publishJobs(), /Usage/);
  const inputPath = await input();
  for (const config of [{}, { ...env, SUPABASE_URL: 'http://remote.example.com' }, { ...env, JOBS_STORAGE_OBJECT: '../jobs.json' }]) {
    let calls = 0;
    await assert.rejects(publishJobs({ inputPath, env: config, fetchImpl: async () => { calls++; } }));
    assert.equal(calls, 0);
  }
});
