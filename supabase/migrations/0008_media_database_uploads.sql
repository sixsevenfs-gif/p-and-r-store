-- Admin access is phone-session based, so media metadata and uploads are handled
-- by the trusted Next.js server rather than the Supabase anon Data API.
alter table public.media_assets add column if not exists data bytea;
