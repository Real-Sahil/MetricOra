-- Daily Carbon Reduction Plan renewal reminders: pg_cron calls the app's secret-protected monitor route,
-- which tells editors 60 and 30 days before the latest signed plan's first anniversary and once it has
-- passed (lib/crp/renewal.ts). Same pattern as 20261016000101_schedule_subcontractor_reminders; see
-- 20260922000010 for the call_app helper and Vault.
--
-- Skipped where pg_cron, pg_net or the scheduler helper are missing (plain Postgres in CI).
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron')
     OR to_regprocedure('scheduler.call_app(text)') IS NULL THEN
    RETURN;
  END IF;

  CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

  PERFORM cron.schedule('metricora-crp-renewal', '23 7 * * *',
    $cmd$SELECT scheduler.call_app('/api/admin/schedule/monitors/crp-renewal')$cmd$);
END $do$;
