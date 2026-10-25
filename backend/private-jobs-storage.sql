-- Run manually in the Supabase SQL editor before publishing a feed.
-- This is independent of application tables and safe to rerun.
-- Replace every jobs-feed literal if JOBS_STORAGE_BUCKET uses a custom bucket.
begin;

insert into storage.buckets (id, name, public)
values ('jobs-feed', 'jobs-feed', false)
on conflict (id) do update set public = false;

-- A restrictive policy is ANDed with existing permissive policies. This also
-- blocks projects that already have a broad allow-read policy on objects.
-- The service role bypasses RLS; no browser role can read or write this feed.
drop policy if exists jobs_feed_service_only on storage.objects;
create policy jobs_feed_service_only on storage.objects
  as restrictive for all to public
  using (bucket_id <> 'jobs-feed')
  with check (bucket_id <> 'jobs-feed');
commit;
