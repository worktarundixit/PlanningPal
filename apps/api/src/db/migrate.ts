import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSql } from './connection.ts'

const here = path.dirname(fileURLToPath(import.meta.url))

/**
 * Migrations open DIRECT_DATABASE_URL (a Neon direct, non-pooler endpoint).
 * The pooler cannot run session-level migration commands reliably.
 * When DIRECT_DATABASE_URL is unset, DATABASE_URL is used — that is the local docker-compose default.
 */
export async function runMigrations() {
  const sql = createSql('direct')
  const database = drizzle(sql)
  try {
    await migrate(database, { migrationsFolder: path.resolve(here, '../../drizzle') })
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
