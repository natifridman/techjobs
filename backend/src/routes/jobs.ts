import { Router, type Request, type Response } from 'express';
import { requireAuth } from './auth';
import { jobsService, JobsUnavailable } from '../jobs/service';
import { buildCatalog, filterJobs, InvalidJobsQuery, parseJobsQuery } from '../jobs/query';
import { csvFileName, jobsToCsv } from '../jobs/exportCsv';

export const GUEST_PREVIEW_LIMIT = 10;
export const AUTHENTICATED_PAGE_SIZE = 20;
const router = Router();

// Cookies determine which records a response may contain. Never reuse a
// signed-in response for a guest in a browser, proxy, or CDN cache.
router.use((_req, res, next) => {
  res.set('Cache-Control', 'private, no-store');
  res.vary('Cookie');
  next();
});

function fail(error: unknown, res: Response) {
  if (error instanceof InvalidJobsQuery) return res.status(400).json({ code: 'INVALID_QUERY', error: error.message });
  if (error instanceof JobsUnavailable) return res.status(503).json({ code: 'JOBS_UNAVAILABLE', error: error.message });
  console.error('Jobs API request failed');
  return res.status(500).json({ error: 'Failed to load jobs' });
}

router.get('/catalog', async (_req, res) => {
  try {
    const { payload, stale } = await jobsService.getSnapshot();
    return res.json(buildCatalog(payload, stale));
  } catch (error) { return fail(error, res); }
});

router.get('/export', requireAuth, async (req, res) => {
  try {
    const { filters } = parseJobsQuery(req.query);
    const { payload } = await jobsService.getSnapshot();
    res.set('Content-Disposition', `attachment; filename="${csvFileName()}"`);
    res.type('text/csv; charset=utf-8');
    return res.send(jobsToCsv(filterJobs(payload, filters)));
  } catch (error) { return fail(error, res); }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const { filters, page } = parseJobsQuery(req.query);
    const authenticated = req.isAuthenticated() && !!req.user;
    if (!authenticated && page > 1) {
      return res.status(401).json({ code: 'AUTH_REQUIRED', error: 'Sign in to view more jobs' });
    }
    const { payload, stale } = await jobsService.getSnapshot();
    const matching = filterJobs(payload, filters);
    const pageSize = authenticated ? AUTHENTICATED_PAGE_SIZE : GUEST_PREVIEW_LIMIT;
    const start = (page - 1) * pageSize;
    return res.json({
      jobs: matching.slice(start, start + pageSize), total: matching.length, page, pageSize,
      access: authenticated ? 'authenticated' : 'guest',
      previewLimit: authenticated ? null : GUEST_PREVIEW_LIMIT,
      requiresAuth: !authenticated && matching.length > GUEST_PREVIEW_LIMIT,
      updatedAt: payload.updatedAt, stale,
    });
  } catch (error) { return fail(error, res); }
});

export default router;
