-- Optional: schedule the daily ingestion from Supabase (pg_cron + pg_net)
-- instead of Vercel Cron. Run once in the SQL editor after replacing the two
-- placeholders. Do not commit real secrets: they live in Supabase Vault.
--
--   1. Dashboard > Database > Extensions: enable pg_cron and pg_net.
--   2. Store the endpoint and secret in Vault:
--        select vault.create_secret('https://YOUR-APP.vercel.app/api/cron/ingest', 'ingest_url');
--        select vault.create_secret('YOUR_CRON_SECRET', 'ingest_cron_secret');
--   3. Run the statement below.

select cron.schedule(
  'stash-daily-ingest',
  '17 4 * * *', -- every day at 04:17 UTC
  $$
  select net.http_get(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'ingest_url'),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'ingest_cron_secret')
    ),
    timeout_milliseconds := 300000
  );
  $$
);

-- To remove it: select cron.unschedule('stash-daily-ingest');
