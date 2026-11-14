-- PlanIt continuous import schedule.
--
-- APPLY THIS BY HAND on the hosted Supabase project (SQL editor or
-- `supabase db push`). This repository change does not run it. The local
-- docker database and the Drizzle migration runner do not load pg_cron.
--
-- Replaces planningpal-planit-ingest (previously `*/5 18-23,0-5 * * *`)
-- with every minute, all day. The URL, the Vault bearer token `cron_secret`,
-- and the 55 second pg_net timeout stay the same.
--
-- pg_cron runs in UTC. `* * * * *` is every minute. The ingest route returns
-- immediately when the London-day queue is already up to date, and it stops
-- at PLANIT_DAILY_CAP (300) requests per Europe/London day.
--
-- Hobby Vercel projects reject cron expressions that run more than once a day,
-- so the timetable stays here. apps/web/vercel.json does not define this job.

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

-- Every minute, all day. One PlanIt request per call; the route enforces the
-- 60 second gap by doing a single page and the 300 request daily cap.
select cron.schedule(
  'planningpal-planit-ingest',
  '* * * * *',
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
