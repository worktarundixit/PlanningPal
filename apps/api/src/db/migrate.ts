import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSql } from './connection.ts'
import { seedLpas } from './seedLpas.ts'

const here = path.dirname(fileURLToPath(import.meta.url))

/**
 * Migrations open DIRECT_DATABASE_URL (Supabase session pooler or direct host, port 5432).
 * The transaction pooler (port 6543) cannot run session-level migration commands reliably.
 * When DIRECT_DATABASE_URL is unset, DATABASE_URL is used — that is the local docker-compose default.
 *
 * `anon` and `authenticated` are created here, outside Drizzle's migration transaction.
 * CREATE ROLE is rejected inside a transaction block. Supabase already has both roles.
 */
async function ensureSupabaseRoles(sql: ReturnType<typeof createSql>) {
  const rows = await sql<{ rolname: string }[]>`select rolname from pg_roles where rolname in ('authenticated', 'anon')`
  const have = new Set(rows.map((row) => row.rolname))
  if (!have.has('anon')) await sql.unsafe('CREATE ROLE anon NOLOGIN')
  if (!have.has('authenticated')) await sql.unsafe('CREATE ROLE authenticated NOLOGIN')
}

export async function runMigrations() {
  const sql = createSql('direct')
  const database = drizzle(sql)
  try {
    await ensureSupabaseRoles(sql)
    await migrate(database, { migrationsFolder: path.resolve(here, '../../drizzle') })
    await seedLpas()
  } finally {
    await sql.end({ timeout: 5 })
  }
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirect) {
  runMigrations()
    .then(() => {
      console.log('Migrations applied')
    })
    .catch((error: unknown) => {
      console.error(error)
      process.exit(1)
    })
}
