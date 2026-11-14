# PlanningPal

Planning leads, intent CRM, and outreach workspace for UK construction contractors. The product name in the engineering spec is AEC Pipeline. The portal is PlanningPal.

## Local setup

Postgres runs in Docker. The API and web app run on the host.

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

- Marketing site: http://localhost:5173/
- Sign in: http://localhost:5173/sign-in
- Command centre: http://localhost:5173/app (redirects to sign-in until a session exists)
- API: http://localhost:3001

`pnpm db:seed` loads `apps/api/data/master-approved-residential.csv` (550 applications, 44 columns) and one demo organisation.

Sign-in uses Supabase Auth. With `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set, the seed creates those users in Supabase (email already confirmed) and stores the same ids on the organisation profiles. Without those keys the seed still writes the organisation rows, and the browser cannot sign in until a Supabase project is connected.

### Local demo accounts

These passwords are for the seeded local database only. Do not reuse them anywhere else.

Password for every account below: `classic123`

| Email | Access |
| --- | --- |
| priya@hitcaliber.co.uk | Super Admin (all organisations, ingestion admin) |
| tarun@design.com | Owner of Micraft Design Ltd |
| emily@micraftdesign.co.uk | Admin |
| daniel@micraftdesign.co.uk | Member |
| hannah@micraftdesign.co.uk | Viewer |

Tests use a separate database, `planningpal_test`, and do not read `.env`:

```bash
pnpm test
pnpm typecheck
pnpm lint
```

## Supabase

Production Postgres and sign-in both use one Supabase project. Local development can keep docker-compose Postgres, or use the Supabase CLI (`supabase start`) for Postgres and Auth together.

### What to create

1. Create a project in the Supabase dashboard.
2. Create the project in **eu-west-2 (London)**. Authentication → Providers: enable Email (password), Magic Link, and Google. Add the Google client id and secret in that screen. Supabase sends the sign-up, magic-link, and password-reset emails. PlanningPal does not send those.
3. Authentication → URL configuration: set the site URL to the Vercel origin (and `http://127.0.0.1:5173` for local). Add redirect URLs for `/app` and `/reset-password` on both origins.
4. Project Settings → API: copy the project URL, the `anon` key, and the `service_role` key.
5. Project Settings → Database: copy the transaction pooler URI (port 6543) into `DATABASE_URL`, and the direct or session URI (port 5432) into `DIRECT_DATABASE_URL`. Both need `sslmode=require`.
6. Create a Resend API key and a verified from-address for new-lead alerts and team invites. That is separate from Supabase auth email.
7. In the Vercel project (root directory `apps/web`, and include files outside that directory so `apps/api` is bundled): set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_DATABASE_URL`, `RESEND_API_KEY`, `RESEND_FROM`, `CRON_SECRET`, `WEB_ORIGIN`, and the `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` pair (same public URL and anon key). The `service_role` key and `DATABASE_URL` stay server-side.

Never commit those values. `.env.example` lists the names only.

Then:

```bash
pnpm db:migrate
pnpm db:seed
```

`DATABASE_URL` is the transaction pooler. Prepared statements are turned off for it. `DIRECT_DATABASE_URL` is the session connection migrations use. If `DIRECT_DATABASE_URL` is omitted, migrations use `DATABASE_URL`, which is correct for docker-compose. `DATABASE_POOL_MAX` caps the API pool (default 10). Migrations always use a single connection.

The API checks every request against the organisation role (Owner, Admin, Member, Viewer) and the platform Super Admin role. Row Level Security policies on the same tables enforce that split for the Supabase Data API (`authenticated`). The table owner used by `DATABASE_URL` bypasses RLS, so the API permission checks stay in force for Vercel Functions. `mail_log`, demo requests, telemetry, and inbox message bodies have RLS enabled with no client policy.

Roles per organisation: Owner, Admin, Member, Viewer. Hitcaliber staff use `platform_role = super_admin`.

## Brand

The mark is the geometric P in `apps/web/public/brand/mark.svg` (`#0B0B24`). The horizontal lockup is that mark plus the word PlanningPal in Manrope SemiBold, outlined so the file does not depend on a font. White variants are the same paths for the navy sidebar.

## Ingestion

PlanIt is the only source implemented. Council portal adapters can implement the same `PlanningSource` interface later.

```bash
pnpm ingest -- --from 2026-10-29 --to 2026-10-30
pnpm ingest -- --authority Camden --recent 7
pnpm ingest -- --recent 3 --max-pages 4
```

On a long-running API process outside Vercel, a local timer calls the same queue at 06:00, 13:00 and 20:00 Europe/London. Set `INGEST_SCHEDULE=off` to disable that timer. The process skips the timer when `VERCEL` is set, because production uses `pg_cron`.

Ingestion targets come from the UK LPA master list (380 active authorities, 43 abolished with a successor). Shared services collapse to one PlanIt area, and Cumberland is read through Allerdale, Carlisle, and Copeland. Ebbsfleet, Middlesbrough, and Hartlepool development corporations have no PlanIt source and stay marked coverage unavailable. Super Admin → Ingestion flags a feed when its latest application is older than `FEED_STALE_DAYS` (default 92).

Scheduled fetches run every minute, all day. Supabase `pg_cron` and `pg_net` POST to `https://planningpal.vercel.app/api/cron/ingest` with `Authorization: Bearer <CRON_SECRET>`. The schedule is `* * * * *`. The secret is read from the Supabase Vault secret named `cron_secret`. The route rejects any call that does not match `CRON_SECRET`. Each call saves at most one PlanIt page (`index` resumes a half-finished authority) and counts toward `PLANIT_DAILY_CAP` (300 requests per Europe/London day). When every authority is already imported for that day, the route returns immediately with `skipped: "up to date"`. A failed authority is remembered with a retry at 5, 15, 30, then 60 minutes, and the sweep moves on. The route answers 200 when the batch succeeded or was skipped, 207 when a retry was recorded, and 500 when the batch failed. Vercel Hobby accounts cannot run a cron more than once a day, so `apps/web/vercel.json` does not define these jobs. Vercel functions stay in `lhr1`. The website and API stay on Vercel.

A fresh queue runs one historical backfill of the last 15 days (`INGEST_BACKFILL_FROM_DAYS`, default 15, maximum 15) across every PlanIt area, paging with `start_date` until each area is done, then switches to the continuous daily import. A Super Admin can start that window with `POST /api/v1/ingest/backfill` and `{ "days": 15 }`. `GET /api/v1/ingest/runs` includes `queue.backfill` (`done`, `total`, `from`) and `queue.requestsToday`. After the backfill, incremental runs use `start_date` from the authority's last success minus one day, and never look further back than `INGEST_BACKFILL_DAYS` (default 14).

Apply this on the hosted Supabase project by hand. Shipping the file does not run it:

`supabase/migrations/20261114120000_planit_ingest_every_minute.sql`

That migration replaces the previous `*/5 18-23,0-5 * * *` job with `* * * * *`. It keeps the same URL, the Vault `cron_secret` bearer token, and the 55 second `pg_net` timeout. `supabase/migrations/20261102120000_schedule_planit_ingest.sql` stays in the history. Store the secret if it is not there yet:

```sql
select vault.create_secret('<same value as Vercel CRON_SECRET>', 'cron_secret', 'Bearer token for the Vercel ingest route');
```

Set that same value as `CRON_SECRET` in the Vercel project environment. Network contact enrichment stays opt-in for a manual run (`enrich: true`) or `pnpm ingest -- --enrich`. Scheduled calls upsert the page first. Idox contact enrichment runs afterwards only when the function still has time, and it keeps its own cursor on source `planit-enrich`.

A new workspace starts with no leads. Command Centre offers **Get recent applications**, then **Last 3 days** or **Last 7 days** (further windows can be added in `LEAD_WINDOWS`). The server walks that workspace's ICP councils in batches. The page polls `/api/v1/lead-fetches/:id/advance`, so cards and KPIs fill while the scan continues. A refresh resumes a running job. An empty window suggests 7 days or a broader ICP. A partial scan keeps what loaded and can retry the failed councils. The every-minute PlanIt import keeps the shared catalogue current after that first fetch.

Each run stores the raw JSON under `apps/api/data/raw` (or `/tmp/planningpal` on Vercel), writes a 44-column CSV, and upserts schemes so they show in Planning search. New rows email owners and admins who turned alerts on, at the frequency they chose (as they arrive, daily, or weekly), through Resend when `RESEND_API_KEY` is set. The Ingestion screen in the command centre lists runs, downloads the CSV, and can start a manual run. Only a Super Admin can open it.

The first sign-in after creating an account opens onboarding: workspace, profile, ideal projects, teammate invites, then alert preferences. An invited person skips workspace creation and joins the workspace on the invite. Progress is stored on the user, so a closed tab resumes the same step. Optional steps can be skipped. The command centre then shows a getting-started checklist until it is dismissed. A Super Admin can see each client's step from the command centre.

PlanIt is rate limited. Scheduled calls make one request per minute. A manual CLI run waits about two seconds between pages, retries with backoff, and sends an identifiable User-Agent. The feed often skips weekends and can lag one or two days.

## Campaign engine

Client workspaces send through one Instantly agency account (API v2). A Super Admin saves that key on Campaign provider. The word does not appear in the client app. It is encrypted with `CAMPAIGN_KEY_ENCRYPTION_SECRET` and later responses only show a mask. Each client is mapped to a provider workspace id, with a tracking domain so links stay on the client's domain. With no key, or with `CAMPAIGN_PROVIDER=sandbox`, the engine stays in sandbox mode and the screens still work. Event delivery uses `CAMPAIGN_WEBHOOK_SECRET` on `/api/v1/campaign-events/:token`. The provider name stays on the server. The web build is checked so it does not contain it.

## What is stubbed

No scraping fleet and no enrichment providers. Inbox replies and queued CRM emails are stored and marked `stubbed`. Team invites and new-lead alerts go through the mailer in `apps/api/src/auth/mailer.ts`: Resend when `RESEND_API_KEY` is set, otherwise a log line and a `mail_log` row. Sign-up, magic link, and password reset are Supabase Auth emails. Google sign-in is enabled in the Supabase dashboard.
