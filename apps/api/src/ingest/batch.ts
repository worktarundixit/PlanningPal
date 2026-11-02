import { planItAuthorityKeys } from '@planningpal/ingest'
import { eq } from 'drizzle-orm'
import { db } from '../db/client.ts'
import { ingestCursors } from '../db/schema.ts'
import { isIngestSlot } from './scheduler.ts'
import { startIngestRun } from './run.ts'

const CURSOR = 'planit-authorities'

/**
 * One Vercel invocation walks authorities until the time budget is spent.
 * The next cron call continues at the saved index, so a full sweep can span slots.
 */
export async function ingestAuthorityBatch(options?: { budgetMs?: number; recentDays?: number; force?: boolean }) {
  if (!options?.force && !isIngestSlot()) {
    return { skipped: true, reason: 'Outside the 06:00, 13:00 and 20:00 Europe/London windows' }
  }
  const authorities = planItAuthorityKeys()
  const budgetMs = options?.budgetMs ?? Number(process.env.INGEST_BUDGET_MS || 45_000)
  const [cursor] = await db.select().from(ingestCursors).where(eq(ingestCursors.source, CURSOR)).limit(1)
  let index = Number(cursor?.lastDifferent || 0)
  if (!Number.isFinite(index) || index < 0 || index >= authorities.length) index = 0
  const started = Date.now()
  const processed: string[] = []
  while (index < authorities.length && Date.now() - started < budgetMs) {
    const authority = authorities[index]
    if (!authority) break
    const run = await startIngestRun({ authority, recentDays: options?.recentDays ?? 3, maxPages: 1 })
    await run.done
    processed.push(authority)
    index += 1
    const next = index >= authorities.length ? '0' : String(index)
    await db
      .insert(ingestCursors)
      .values({ source: CURSOR, lastDifferent: next, updatedAt: new Date() })
      .onConflictDoUpdate({ target: ingestCursors.source, set: { lastDifferent: next, updatedAt: new Date() } })
  }
  if (index >= authorities.length) index = 0
  return { skipped: false, processed, nextIndex: index, total: authorities.length }
}
