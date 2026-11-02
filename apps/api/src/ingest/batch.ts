import { eq } from 'drizzle-orm'
import { db } from '../db/client.ts'
import { ingestCursors, localPlanningAuthorities } from '../db/schema.ts'
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
  const catalogue = await db
    .select({ areas: localPlanningAuthorities.planitQueryAreas, status: localPlanningAuthorities.status, coverage: localPlanningAuthorities.coverage })
    .from(localPlanningAuthorities)
  const authorities = [...new Set(catalogue.filter((row) => row.status === 'active' && row.coverage !== 'unavailable').flatMap((row) => row.areas))].sort((a, b) => a.localeCompare(b))
  const budgetMs = options?.budgetMs ?? Number(process.env.INGEST_BUDGET_MS || 45_000)
  const [cursor] = await db.select().from(ingestCursors).where(eq(ingestCursors.source, CURSOR)).limit(1)
  let index = Number(cursor?.lastDifferent || 0)
  if (!Number.isFinite(index) || index < 0 || index >= authorities.length) index = 0
  const started = Date.now()
  const processed: string[] = []
  const failed: { authority: string; error: string }[] = []
  while (index < authorities.length && Date.now() - started < budgetMs) {
    const authority = authorities[index]
    if (!authority) break
    try {
      const run = await startIngestRun({ authority, recentDays: options?.recentDays ?? 3, maxPages: 1 })
      await run.done
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authority scan failed'
      failed.push({ authority, error: message })
      // Leave the cursor on this authority so the next slot retries it.
      break
    }
    processed.push(authority)
    index += 1
    const next = index >= authorities.length ? '0' : String(index)
    await db
      .insert(ingestCursors)
      .values({ source: CURSOR, lastDifferent: next, updatedAt: new Date() })
      .onConflictDoUpdate({ target: ingestCursors.source, set: { lastDifferent: next, updatedAt: new Date() } })
  }
  if (index >= authorities.length) index = 0
  return { ok: failed.length === 0, skipped: false, processed, failed, nextIndex: index, total: authorities.length }
}
