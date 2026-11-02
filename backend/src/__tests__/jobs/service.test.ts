import { createJobsService, JOBS_CACHE_TTL_MS, JOBS_RETRY_DELAY_MS, JobsUnavailable, readPrivateJobsObject } from '../../jobs/service';
import { job, payload } from './fixtures';

describe('validated jobs snapshot cache', () => {
  let now: number;
  beforeEach(() => { now = 1000; jest.spyOn(console, 'warn').mockImplementation(() => {}); });

  it('shares simultaneous reads and uses the cache for five minutes', async () => {
    let resolve!: (value: unknown) => void;
    const read = jest.fn(() => new Promise(resolveRead => { resolve = resolveRead; }));
    const service = createJobsService(read, () => now);
    const first = service.getSnapshot();
    const second = service.getSnapshot();
    expect(first).toBe(second);
    expect(read).toHaveBeenCalledTimes(1);
    resolve(payload([job()]));
    const result = await first;
    expect(result.stale).toBe(false);
    now += JOBS_CACHE_TTL_MS - 1;
    expect((await service.getSnapshot()).payload).toBe(result.payload);
    expect(read).toHaveBeenCalledTimes(1);
    now++;
    const refresh = service.getSnapshot();
    expect(read).toHaveBeenCalledTimes(2);
    resolve(payload([]));
    expect((await refresh).payload.jobs).toEqual([]);
  });

  it('serves last-good data as stale after network/validation failures and recovers', async () => {
    const read = jest.fn<Promise<unknown>, []>()
      .mockResolvedValueOnce(payload([job()]))
      .mockRejectedValueOnce(new Error('service key must not leak'))
      .mockResolvedValueOnce({ updatedAt: 'invalid', jobs: [] })
      .mockResolvedValueOnce(payload([]));
    const service = createJobsService(read, () => now);
    const initial = await service.getSnapshot();
    now += JOBS_CACHE_TTL_MS;
    for (let i = 0; i < 2; i++) {
      const stale = await service.getSnapshot();
      expect(stale.stale).toBe(true);
      expect(stale.payload).toBe(initial.payload);
      // Requests during the cooldown share stale data without retrying.
      expect((await service.getSnapshot()).stale).toBe(true);
      expect(read).toHaveBeenCalledTimes(i + 2);
      now += JOBS_RETRY_DELAY_MS;
    }
    const recovered = await service.getSnapshot();
    expect(recovered.stale).toBe(false);
    expect(recovered.payload.jobs).toEqual([]);
  });

  it('shares cold failures without caching a rejection, and permits later recovery', async () => {
    let reject!: (error: Error) => void;
    const read = jest.fn<Promise<unknown>, []>()
      .mockImplementationOnce(() => new Promise((_resolve, rejectRead) => { reject = rejectRead; }))
      .mockResolvedValueOnce(payload([job()]));
    const service = createJobsService(read);
    const first = service.getSnapshot();
    const second = service.getSnapshot();
    const failures = Promise.allSettled([first, second]);
    reject(new Error('secret upstream exception'));
    for (const result of await failures) {
      expect(result.status).toBe('rejected');
      if (result.status === 'rejected') {
        expect(result.reason).toBeInstanceOf(JobsUnavailable);
        expect(result.reason.message).toBe('Jobs are temporarily unavailable');
      }
    }
    expect(read).toHaveBeenCalledTimes(1);
    expect((await service.getSnapshot()).payload.jobs).toHaveLength(1);
    expect(read).toHaveBeenCalledTimes(2);
  });

  it('rejects invalid cold envelopes instead of returning an empty success', async () => {
    const service = createJobsService(async () => ({ schemaVersion: 9, updatedAt: '2026-10-25', jobs: [] }));
    await expect(service.getSnapshot()).rejects.toBeInstanceOf(JobsUnavailable);
  });
});

describe('private Supabase Storage reader', () => {
  const originalBucket = process.env.JOBS_STORAGE_BUCKET;
  const originalObject = process.env.JOBS_STORAGE_OBJECT;
  afterEach(() => {
    if (originalBucket === undefined) delete process.env.JOBS_STORAGE_BUCKET; else process.env.JOBS_STORAGE_BUCKET = originalBucket;
    if (originalObject === undefined) delete process.env.JOBS_STORAGE_OBJECT; else process.env.JOBS_STORAGE_OBJECT = originalObject;
  });

  function storage(bucket: unknown = { public: false }, bucketError: unknown = null) {
    const download = { ok: true, status: 200, json: async () => payload([job()]) };
    const inspect = { ok: !bucketError, status: bucketError ? 500 : 200, json: async () => bucket };
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce(inspect as Response).mockResolvedValue(download as Response);
    return { fetchMock };
  }

  it('reads the default private bucket/object with service authentication and a shared abort deadline', async () => {
    delete process.env.JOBS_STORAGE_BUCKET; delete process.env.JOBS_STORAGE_OBJECT;
    const { fetchMock } = storage();
    expect(await readPrivateJobsObject()).toMatchObject({ jobs: [expect.objectContaining({ company: 'Acme' })] });
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:54321/storage/v1/bucket/jobs-feed');
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:54321/storage/v1/object/authenticated/jobs-feed/jobs.json');
    const options = fetchMock.mock.calls[0][1]!;
    expect(options.headers).toEqual({ apikey: 'test-service-key', Authorization: 'Bearer test-service-key' });
    expect(options.redirect).toBe('error');
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(fetchMock.mock.calls[1][1]!.signal).toBe(options.signal);
  });

  it('supports configured bucket and object names', async () => {
    process.env.JOBS_STORAGE_BUCKET = 'custom-feed'; process.env.JOBS_STORAGE_OBJECT = 'snapshots/current feed.json';
    const { fetchMock } = storage();
    await readPrivateJobsObject();
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:54321/storage/v1/bucket/custom-feed');
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:54321/storage/v1/object/authenticated/custom-feed/snapshots/current%20feed.json');
  });

  it.each([{ public: true }, {}, null])('refuses a public or unverified bucket %j', async bucket => {
    const { fetchMock } = storage(bucket);
    await expect(readPrivateJobsObject()).rejects.toThrow('private');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects failed bucket inspections and object downloads', async () => {
    const { fetchMock } = storage({ public: false }, { message: 'failed' });
    await expect(readPrivateJobsObject()).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockReset().mockResolvedValueOnce({ ok: true, json: async () => ({ public: false }) } as Response)
      .mockResolvedValueOnce({ ok: false, status: 404 } as Response);
    await expect(readPrivateJobsObject()).rejects.toThrow('download');
  });

  it('propagates abort failures so an expired read can release the cache flight', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new DOMException('Timeout', 'TimeoutError'));
    await expect(readPrivateJobsObject()).rejects.toThrow('Timeout');
  });
});
