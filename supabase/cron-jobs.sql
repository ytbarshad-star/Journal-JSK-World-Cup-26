-- ============================================================
-- SUPABASE CRON JOBS
-- Run this in Supabase SQL Editor after enabling pg_cron extension
-- ============================================================

-- Enable pg_cron (do this in Supabase Dashboard > Extensions first)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Sync matches every 6 hours
SELECT cron.schedule(
  'sync-wc-matches',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/sync-matches',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
    ),
    body := '{}'::jsonb
  )
  $$
);

-- Check match results every 15 minutes
SELECT cron.schedule(
  'check-match-results',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/check-results',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
    ),
    body := '{}'::jsonb
  )
  $$
);

-- Calculate daily winner at 23:55 UTC (03:55 UAE next day)
SELECT cron.schedule(
  'calculate-daily-winner',
  '55 19 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/daily-winner',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
    ),
    body := '{}'::jsonb
  )
  $$
);
