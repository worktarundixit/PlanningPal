import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { LPA_RECORDS } from '@planningpal/shared'

const here = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(here, '../../../..')
const drizzleDir = path.resolve(here, '../../drizzle')
const cronFiles = [
  '20261102120000_schedule_planit_ingest.sql',
  '20261114120000_planit_ingest_every_minute.sql',
].map((name) => path.join(repo, 'supabase/migrations', name))
const outFile = path.join(repo, 'supabase/release/0001_full_schema.sql')

const tags = [
  '0000_init',
  '0001_demo_requests',
  '0002_ingest',
  '0003_auth',
  '0004_supabase_rls',
  '0005_campaign_provider',
  '0006_workspace_isolation',
  '0007_private_records',
  '0008_onboarding',
  '0009_lead_fetches',
  '0010_local_planning_authorities',
]

function sqlText(value: string) {
  return `'${value.replace(/'/g, "''")}'`
}

function sqlNullableText(value: string | null) {
  return value ? sqlText(value) : 'null'
}

function sqlNullableInt(value: number | null) {
  return value == null ? 'null' : String(value)
}

function sqlArray(values: string[]) {
  if (!values.length) return 'ARRAY[]::text[]'
  return `ARRAY[${values.map(sqlText).join(',')}]::text[]`
}

function migrationSql(tag: string) {
  const raw = readFileSync(path.join(drizzleDir, `${tag}.sql`), 'utf8')
  const body = raw
    .split('\n')
    .filter((line) => !/^\s*--> statement-breakpoint\s*$/.test(line))
    .join('\n')
    .trim()
  return `-- ${tag}.sql\n${body}\n`
}

function lpaSeed() {
  const columns = [
    'name', 'nation', 'region', 'county', 'type', 'gss_code', 'lpa_gss_code',
    'planit_area_name', 'planit_area_id', 'planit_covered', 'planit_scraper_type',
    'planit_latest_app_date', 'planit_total_apps', 'planning_portal_url', 'website',
    'status', 'end_date', 'successor', 'notes', 'coverage', 'planit_query_areas',
  ]
  const rows = LPA_RECORDS.map((row) => `(${[
    sqlText(row.name),
    sqlText(row.nation),
    sqlText(row.region),
    sqlText(row.county),
    sqlText(row.type),
    sqlText(row.gssCode),
    sqlText(row.lpaGssCode),
    sqlText(row.planitAreaName),
    sqlNullableInt(row.planitAreaId),
    sqlText(row.planitCovered),
    sqlText(row.planitScraperType),
    sqlNullableText(row.planitLatestAppDate),
    sqlNullableInt(row.planitTotalApps),
    sqlText(row.planningPortalUrl),
    sqlText(row.website),
    sqlText(row.status),
    sqlNullableText(row.endDate),
    sqlText(row.successor),
    sqlText(row.notes),
    sqlText(row.coverage),
    sqlArray(row.planitQueryAreas),
  ].join(', ')})`)
  const chunks: string[] = []
  const size = 40
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(`INSERT INTO local_planning_authorities (${columns.join(', ')})\nVALUES\n${rows.slice(index, index + size).join(',\n')};`)
  }
  return `-- UK LPA master seed (${LPA_RECORDS.length} authorities)\n${chunks.join('\n\n')}\n`
}

const header = `-- PlanningPal release schema for an empty Supabase database (eu-west-2).
-- Paste this whole file into the Supabase SQL editor on the postgres database.
-- It is ordered: Drizzle migrations 0000–0010 (including RLS), the UK LPA seed, then the pg_cron schedule.
-- Supabase already has the anon and authenticated roles. Do not run this on a database that already has these tables.
-- After it succeeds, store the same value as Vercel CRON_SECRET:
--   select vault.create_secret('<paste CRON_SECRET>', 'cron_secret', 'Bearer token for the Vercel ingest route');
-- The local Drizzle runner does not apply the pg_cron section.

`

const parts = [header, ...tags.map(migrationSql), lpaSeed(), `-- pg_cron schedule\n${cronFiles.map((file) => readFileSync(file, 'utf8').trim()).join('\n\n')}\n`]
mkdirSync(path.dirname(outFile), { recursive: true })
writeFileSync(outFile, parts.join('\n'))
console.log(`Wrote ${outFile} (${LPA_RECORDS.length} authorities)`)
