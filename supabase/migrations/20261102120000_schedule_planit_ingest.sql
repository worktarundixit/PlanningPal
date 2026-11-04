-- PlanIt ingestion schedule. Apply this on the hosted Supabase project
-- (SQL editor or `supabase db push`). The local docker database and the
-- Drizzle migration runner do not load pg_cron.
--
-- Hobby Vercel projects reject cron expressions that run more than once a day,
-- so the timetable lives here. pg_cron runs in UTC.
--
-- Store the same value as Vercel CRON_SECRET before the job can succeed.
-- Do not put that value in this file:
--
--   select vault.create_secret(
--     '<paste the Vercel CRON_SECRET value>',
--     'cron_secret',
--     'Bearer token for https://planningpal.vercel.app/api/cron/ingest'
--   );

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'planningpal-planit-ingest') then
    perform cron.unschedule('planningpal-planit-ingest');
  end if;
end $$;

-- PlanIt overnight schedule (18:00–06:00 UTC, every 5 minutes = 144 requests/night,
-- respecting PlanIt's >=60s interval and 300 requests/day cap).
select cron.schedule(
  'planningpal-planit-ingest',
  '*/5 18-23,0-5 * * *',
  $job$
  select net.http_post(
    url := 'https://planningpal.vercel.app/api/cron/ingest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization',
      'Bearer ' || coalesce(
        (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret' limit 1),
        ''
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
  $job$
);
