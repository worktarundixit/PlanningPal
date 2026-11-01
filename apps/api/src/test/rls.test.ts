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
})
