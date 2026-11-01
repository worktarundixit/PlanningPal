import { drizzle } from 'drizzle-orm/postgres-js'
import { createSql } from './connection.ts'
import * as schema from './schema.ts'

/** Runtime queries. Uses DATABASE_URL and disables prepared statements when that URL is a transaction pooler. */
export const sqlClient = createSql('pooled')
export const db = drizzle(sqlClient, { schema })

export async function closeDb() {
  await sqlClient.end({ timeout: 5 })
}
