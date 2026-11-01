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

### Local demo accounts

These passwords are for the seeded local database only. Do not reuse them anywhere else.

Password for every account below: `PlanningPal-local-1`

| Email | Access |
| --- | --- |
| priya@hitcaliber.co.uk | Super Admin (all organisations, ingestion admin) |
| james@micraftdesign.co.uk | Owner of Micraft Design Ltd |
| emily@micraftdesign.co.uk | Admin |
| daniel@micraftdesign.co.uk | Member |
| hannah@micraftdesign.co.uk | Viewer |

Tests use a separate database, `planningpal_test`, and do not read `.env`:

```bash
pnpm test
pnpm typecheck
pnpm lint
```

## Neon

Production Postgres is Neon. Local docker-compose is unchanged.

Set both URLs in the host environment. Both need `sslmode=require`.

- `DATABASE_URL` is the **pooled** connection (hostname contains `-pooler`). The API uses it. Prepared statements are turned off for the pooler, because Neon’s PgBouncer is in transaction mode.
- `DIRECT_DATABASE_URL` is the **direct** connection (no `-pooler`). Migrations use it. Session locks and multi-statement migrations are not reliable through the pooler.

If `DIRECT_DATABASE_URL` is omitted, migrations use `DATABASE_URL`. That is the right default for docker-compose, where there is no pooler.

Against a Neon database:

```bash
export DATABASE_URL='postgresql://USER:PASSWORD@ep-example-pooler.region.aws.neon.tech/neondb?sslmode=require'
export DIRECT_DATABASE_URL='postgresql://USER:PASSWORD@ep-example.region.aws.neon.tech/neondb?sslmode=require'
pnpm db:migrate
pnpm db:seed
```

`sslmode=require` encrypts the connection without verifying the certificate authority, which matches Neon’s Node guidance. A `channel_binding` parameter copied from the Neon dashboard is stripped before connect. `DATABASE_POOL_MAX` caps the API pool (default 10). Migrations always use a single connection.

## Brand

The mark is the geometric P in `apps/web/public/brand/mark.svg` (`#0B0B24`). The horizontal lockup is that mark plus the word PlanningPal in Manrope SemiBold, outlined so the file does not depend on a font. White variants are the same paths for the navy sidebar.

## Ingestion

PlanIt is the only source implemented. Council portal adapters can implement the same `PlanningSource` interface later.

```bash
pnpm ingest -- --from 2026-10-29 --to 2026-10-30
pnpm ingest -- --authority Camden --recent 7
pnpm ingest -- --recent 3 --max-pages 4
```

The API process also runs the pipeline at 06:00, 13:00 and 20:00 Europe/London. Set `INGEST_SCHEDULE=off` to disable that. On Railway or Fly, run `pnpm ingest` from a cron service instead of keeping a second scheduler. Each run stores the raw JSON under `apps/api/data/raw`, writes a 44-column CSV under `apps/api/data/ingest`, and upserts schemes so they show in Planning search. The Ingestion screen in the command centre lists runs, downloads the CSV, and can start a manual run. Only a Super Admin can open it.

PlanIt is rate limited. The client waits about two seconds between requests, retries with backoff, and sends an identifiable User-Agent. The feed often skips weekends and can lag one or two days.

## What is stubbed

No scraping fleet, no enrichment providers, no real email. Inbox replies and queued CRM emails are stored and marked `stubbed`. Account email (verification, password reset, magic link, and team invite) goes through a mailer interface that logs the message in development and stores it in `mail_log`. Google and Microsoft sign-in are registered only when their client id and secret are set.
