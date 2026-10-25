# TechJobsIL

An Israeli tech job board built with React, TypeScript, Express, Google OAuth, and Supabase.

Guests can search and filter the first **10 matching jobs** per result set, apply on employer websites, and save jobs in their browser. Signing in with Google unlocks the remaining results, CSV export, and saved-job syncing. The limit is enforced by the backend; changing a search starts a new preview, rather than consuming a lifetime allowance.

## Architecture

- `frontend/`: Vite/React app. Reads paginated jobs and public company/city summaries from the backend.
- `backend/`: Express API, Passport sessions stored in Supabase Postgres, and a private Storage feed reader.
- `scripts/convert_jobs.mjs`: converts source records into the versioned site payload.
- `scripts/publish_jobs.mjs`: validates and uploads that payload to private Supabase Storage.

The full feed is never bundled into the frontend or supplied as a public download URL. Backend instances cache validated snapshots for five minutes. A failed refresh preserves the last valid snapshot with a stale indicator; a cold-start failure returns a retryable 503.

## Local development

Use Node.js 20 or newer. Install dependencies:

```sh
npm --prefix backend ci
npm --prefix frontend ci
```

Copy `backend/.env.example` to `backend/.env` and configure:

| Backend variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Server-only service-role credential |
| `DATABASE_URL` | Supabase Postgres session-pooler connection string |
| `SESSION_SECRET` | Strong random session secret; required in production |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
| `FRONTEND_URL` | Allowed OAuth return origin; use `http://localhost:5173` locally |
| `GOOGLE_CALLBACK_URL` | Use `http://localhost:5173/auth/google/callback` with the Vite proxy |
| `CORS_ORIGIN` | Frontend origin |
| `JOBS_STORAGE_BUCKET` | Private bucket, default `jobs-feed` |
| `JOBS_STORAGE_OBJECT` | Payload object, default `jobs.json` |

Run `backend/supabase-schema.sql` in the Supabase SQL editor for application tables and sessions. Configure Google OAuth with the exact callback URL above, then set up the private feed as described below.

Start the two development servers:

```sh
npm --prefix backend run dev
npm --prefix frontend run dev
```

Open `http://localhost:5173`. Vite proxies `/api` and `/auth` to port 3001. Frontend `VITE_API_URL` defaults to `/api`; no frontend secret or job-feed URL is needed. Optional analytics/advertising configuration is documented in `frontend/.env.example`.

For the existing Make commands, configure the root `.env` instead; Make exports it to both processes. Do not put private configuration in a variable prefixed `VITE_`.

## Private jobs feed

1. Run `backend/private-jobs-storage.sql` in the Supabase SQL editor. It creates the private `jobs-feed` bucket and restricts browser-role access even if the project has broader Storage policies. If using a different bucket, update the bucket name in both the SQL and configuration.
2. Convert source data into a local payload outside the frontend's public directory:

   ```sh
   node scripts/convert_jobs.mjs /path/to/source-jobs.json /tmp/techjobs-feed.json
   ```

3. Set backend credentials in your shell (or load them from your deployment's secret manager), then publish:

   ```sh
   npm --prefix backend run publish:jobs -- /tmp/techjobs-feed.json
   ```

   The npm command builds the backend parser first. Publishing validates the version, count, and records before making a request, then refuses to upload unless the destination bucket is private. The command reads environment variables from its process; it does not automatically load a `.env` file.

4. Schedule your existing data publisher to run the conversion and private upload after each successful scrape. Feed changes do not require a frontend redeploy.

The old `VITE_JOBS_DATA_URL` integration has been removed. Do not retain public copies in a web server, frontend `public/`, static hosting, or a CDN. No signed full-feed URL should be supplied to browsers.

## API

| Method | Endpoint | Access and behavior |
| --- | --- | --- |
| GET | `/api/jobs` | First 10 matching jobs for guests; 20 per page when signed in |
| GET | `/api/jobs/catalog` | Public counts, facets, and company/city summaries without individual job records |
| GET | `/api/jobs/export` | Signed-in CSV export of all filtered matches |
| GET | `/auth/me` | Current session status |
| GET | `/auth/google` | Google sign-in; same-origin return destination |
| GET | `/auth/google/callback` | Return to the search and continuation point after OAuth |
| POST | `/auth/logout` | End session |
| GET/POST | `/api/saved-jobs` | Account-specific saved jobs; requires sign-in |
| PUT/DELETE | `/api/saved-jobs/:id` | Update/remove an account save; requires sign-in |
| GET | `/api/companies` | Existing company metadata API |

Job queries accept `search`, `company`, `page`, and `showClosed`. Repeat `category`, `city`, `region`, `workModel`, `employmentType`, and `seniority` for multiple selections. Existing `search`, `category`, and `city` links continue to work. Closed listings are hidden by default.

Responses include `jobs`, `total`, `page`, `pageSize`, `access`, `previewLimit`, `requiresAuth`, `updatedAt`, and `stale`. Guests requesting later pages receive `401 AUTH_REQUIRED`. Client-supplied limits or access flags cannot expand the preview. Job and auth responses use private/no-store caching; browser query caches are isolated by access scope and cleared on sign-out.

Local guest saves and application tracking remain available and reconcile into the account after sign-in. Account data continues to live in Supabase Postgres; no jobs-table migration is required.

## Checks

```sh
npm test
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix backend run build
```

Tests cover payload validation, guest limits and query tampering, catalog projections, private feed caching, authenticated exports, OAuth continuation, cache isolation, URL state, guest-save reconciliation, and the existing converter behavior. Browser QA should cover 360px, 390px, 768px, and 1280px viewports, keyboard navigation, long/Hebrew titles, reduced motion, and the tenth-result sign-in panel.

## Deployment

The root Dockerfile builds the frontend and serves it from Express. `podman-compose.yml` alternatively runs nginx and the API separately; it requires the database, private Storage, session, and OAuth variables from root `.env`. Set production frontend/callback URLs to the actual HTTPS deployment.

Release order:

1. Provision private Storage and publish a validated feed.
2. Deploy the backend and verify guest requests return at most 10 records, later pages and exports require authentication, and catalog responses contain no individual jobs.
3. Deploy the matching frontend. Disable the old public full-feed delivery and purge any serving caches before marking the release complete.
4. Verify successful/cancelled live Google sign-in preserves filters, guest saves sync, and sign-out removes full results.
5. Monitor feed read errors, 503 responses, OAuth failures, preview views, and preview sign-in conversions using existing logging/analytics.

A rollback must retain the private feed and server-enforced limits. Do not restore the former frontend that fetches the complete public dataset.

## Identity

The visual identity uses a minimal geometric Israeli star, an indigo/slate wordmark, and a light neutral interface. Brand assets live in `frontend/public/brand/`, with favicon, application icon, and social preview files in `frontend/public/`. The historical `/techjobsil-logo-64.png` URL remains available with the refreshed mark.

## License

MIT
