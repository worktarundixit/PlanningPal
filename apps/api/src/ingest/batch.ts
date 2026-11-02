import type { IngestSourceId } from '@planningpal/ingest'
import { eq } from 'drizzle-orm'
import { db } from '../db/client.ts'
import { ingestCursors, localPlanningAuthorities } from '../db/schema.ts'
import { isIngestSlot } from './scheduler.ts'
import { startIngestRun } from './run.ts'

const CURSOR = 'planit-authorities'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * One Vercel invocation walks authorities until the time budget or batch limit is spent.
 * Defaults to 1 authority per invocation so PlanIt's 1-request/minute limit is respected.
 * The next cron call continues at the saved index, so a full sweep spans slots cleanly.
 */
export async function ingestAuthorityBatch(options?: {
  budgetMs?: number
  recentDays?: number
  force?: boolean
  maxAuthorities?: number
  intervalMs?: number
  source?: IngestSourceId
}) {
  if (!options?.force && !isIngestSlot()) {
    return { skipped: true, reason: 'Outside the scheduled Europe/London windows' }
  }
  const catalogue = await db
    .select({ areas: localPlanningAuthorities.planitQueryAreas, status: localPlanningAuthorities.status, coverage: localPlanningAuthorities.coverage })
    .from(localPlanningAuthorities)
  const authorities = [...new Set(catalogue.filter((row) => row.status === 'active' && row.coverage !== 'unavailable').flatMap((row) => row.areas))].sort((a, b) => a.localeCompare(b))
  const budgetMs = options?.budgetMs ?? Number(process.env.INGEST_BUDGET_MS || 45_000)
  const maxAuthorities = options?.maxAuthorities ?? Number(process.env.INGEST_BATCH_LIMIT || 1)
  const intervalMs = options?.intervalMs ?? Number(process.env.PLANIT_MIN_INTERVAL_MS || 60_000)
  const [cursor] = await db.select().from(ingestCursors).where(eq(ingestCursors.source, CURSOR)).limit(1)
  let index = Number(cursor?.lastDifferent || 0)
  if (!Number.isFinite(index) || index < 0 || index >= authorities.length) index = 0
  const started = Date.now()
  const processed: string[] = []
  const failed: { authority: string; error: string }[] = []
  while (index < authorities.length && processed.length < maxAuthorities && Date.now() - started < budgetMs) {
    const authority = authorities[index]
    if (!authority) break
    if (processed.length > 0 && intervalMs > 0) {
      if (Date.now() - started + intervalMs >= budgetMs) break
      await sleep(intervalMs)
    }
    try {
      const run = await startIngestRun({
        authority,
        recentDays: options?.recentDays ?? 3,
        maxPages: 1,
        source: options?.source,
      })
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
