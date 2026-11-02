import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { db, sqlClient } from '../db/client.ts'
import { runMigrations } from '../db/migrate.ts'
import { campaigns, organisations, users } from '../db/schema.ts'

const actor = randomUUID()

async function restoreUid(sql: { unsafe: (query: string) => Promise<unknown> }) {
  await sql.unsafe('RESET ROLE')
  await sql.unsafe(`CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $fn$ SELECT NULL::uuid $fn$`)
}

beforeAll(async () => {
  await runMigrations()
})

afterAll(async () => {
  await restoreUid(sqlClient)
})

describe('row level security', () => {
  it('lets a signed-in role read only its organisation and blocks a cross-tenant write', async () => {
    const [orgA] = await db.insert(organisations).values({ companyName: `RLS A ${randomUUID()}` }).returning()
    const [orgB] = await db.insert(organisations).values({ companyName: `RLS B ${randomUUID()}` }).returning()
    await db.insert(users).values({
      organisationId: orgA!.id,
      authUserId: actor,
      email: `rls-${randomUUID()}@example.com`,
      name: 'RLS member',
      orgRole: 'member',
      apiToken: randomUUID(),
    })
    await db.insert(campaigns).values({ organisationId: orgA!.id, name: `Visible ${actor}` })
    await db.insert(campaigns).values({ organisationId: orgB!.id, name: `Hidden ${actor}` })

    const sql = await sqlClient.reserve()
    try {
      await sql.unsafe('BEGIN')
      await sql.unsafe(`CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $fn$ SELECT '${actor}'::uuid $fn$`)
      await sql.unsafe('SET LOCAL ROLE authenticated')
      const rows = await sql<{ name: string }[]>`select name from campaigns where name in (${`Visible ${actor}`}, ${`Hidden ${actor}`})`
      expect(rows.map((row) => row.name)).toEqual([`Visible ${actor}`])
      let blocked = false
      try {
        await sql.unsafe(`insert into campaigns (organisation_id, name) values ('${orgB!.id}', 'Intrusion ${actor}')`)
      } catch (error) {
        blocked = /row-level security/i.test(error instanceof Error ? error.message : String(error))
        await sql.unsafe('ROLLBACK')
        await sql.unsafe('BEGIN')
      }
      expect(blocked).toBe(true)
      await restoreUid(sql)
      await sql.unsafe('COMMIT')
    } finally {
      await restoreUid(sql).catch(() => undefined)
      sql.release()
    }
  })

  it('keeps row level security enabled and blocks a viewer write', async () => {
    const tables = [
      'organisations', 'users', 'workspace_members', 'audit_log', 'team_members', 'custom_roles',
      'saved_schemes', 'crm_leads', 'activities', 'campaigns', 'sending_domains', 'inbox_conversations',
      'inbox_messages', 'intent_events', 'persona_templates', 'meetings', 'invoices', 'invitations',
      'campaign_provider_settings', 'campaign_provider_mappings', 'campaign_engine_links',
      'planning_applications', 'councils', 'decision_makers', 'pipeline_runs', 'raw_payloads',
      'ingest_cursors', 'mail_log', 'demo_requests', 'telemetry_events',
    ]
    const flags = await sqlClient<{ relname: string; relrowsecurity: boolean }[]>`
      SELECT c.relname, c.relrowsecurity
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname IN ${sqlClient(tables)}
    `
    expect(flags).toHaveLength(tables.length)
    expect(flags.every((row) => row.relrowsecurity)).toBe(true)

    const viewer = randomUUID()
    const [org] = await db.insert(organisations).values({ companyName: `RLS viewer ${viewer}` }).returning()
    await db.insert(users).values({
      organisationId: org!.id,
      authUserId: viewer,
      email: `viewer-${viewer}@example.com`,
      name: 'RLS viewer',
      orgRole: 'viewer',
      apiToken: randomUUID(),
    })
    const sql = await sqlClient.reserve()
    try {
      await sql.unsafe('BEGIN')
      await sql.unsafe(`CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $fn$ SELECT '${viewer}'::uuid $fn$`)
      await sql.unsafe('SET LOCAL ROLE authenticated')
      let blocked = false
      try {
        await sql.unsafe(`insert into campaigns (organisation_id, name) values ('${org!.id}', 'Viewer write ${viewer}')`)
      } catch (error) {
        blocked = /row-level security/i.test(error instanceof Error ? error.message : String(error))
        await sql.unsafe('ROLLBACK')
        await sql.unsafe('BEGIN')
      }
      expect(blocked).toBe(true)
      await restoreUid(sql)
      await sql.unsafe('COMMIT')
    } finally {
      await restoreUid(sql).catch(() => undefined)
      sql.release()
    }
  })
})
