-- Migration 003: Schedule hourly ingestion via pg_cron + pg_net
--
-- Replaces the GitHub Actions schedule (which was drifting by hours under
-- GitHub's global scheduler load) with a cron job running inside Supabase's
-- own Postgres instance, calling the ingest-urgences Edge Function.
--
-- Prerequisites (run manually, in this order, before this file):
--   1. Deploy the Edge Function: supabase functions deploy ingest-urgences
--   2. Store the service role key in Vault:
--        select vault.create_secret('<your-service-role-key>', 'ingest_function_service_role_key');
--   3. Replace <PROJECT_REF> below with your actual project ref.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'ingest-urgences-hourly',
  '5 * * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/ingest-urgences',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'ingest_function_service_role_key'
      )
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
