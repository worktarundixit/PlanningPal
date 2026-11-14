import type { IngestSourceId } from '@planningpal/ingest'
import { eq } from 'drizzle-orm'
import { db } from '../db/client.ts'
import { ingestCursors, localPlanningAuthorities } from '../db/schema.ts'
import { isIngestSlot } from './clock.ts'
import {
  PLANIT_PAGE_SIZE,
  QUEUE_SOURCE,
  applyPageOutcome,
  backfillCapDays,
  historicalBackfillDays,
  londonDate,
  normalizeCursor,
  parseQueueCursor,
  pickWork,
  queueProgress,
  serializeQueueCursor,
  startHistoricalBackfill,
  withBackfillSeed,
  type QueueCursor,
} from './queue.ts'
import { enrichMissingContacts, startIngestRun } from './run.ts'

const ENRICH_MIN_REMAINING_MS = 8_000

export type AuthorityBatchResult = {
  ok: boolean
  skipped: false | 'daily cap' | 'up to date' | 'busy' | 'outside window'
  partial: boolean
  processed: string[]
  failed: { authority: string; error: string }[]
  nextIndex: number
  total: number
  requestsToday: number
  backfill: { from: string; done: number; total: number } | null
}

function resultFor(
  cursor: QueueCursor,
  total: number,
  extra: Pick<AuthorityBatchResult, 'ok' | 'skipped' | 'partial' | 'processed' | 'failed'>,
): AuthorityBatchResult {
  const progress = queueProgress(cursor, total)
  return {
    ...extra,
    nextIndex: cursor.index,
    total,
    requestsToday: progress.requestsToday,
    backfill: progress.backfill,
  }
}

async function loadAuthorities() {
  const catalogue = await db
    .select({
      areas: localPlanningAuthorities.planitQueryAreas,
      status: localPlanningAuthorities.status,
      coverage: localPlanningAuthorities.coverage,
    })
    .from(localPlanningAuthorities)
  return [...new Set(catalogue.filter((row) => row.status === 'active' && row.coverage !== 'unavailable').flatMap((row) => row.areas))].sort((a, b) =>
    a.localeCompare(b),
  )
}

async function readCursor(today: string) {
  const [row] = await db.select().from(ingestCursors).where(eq(ingestCursors.source, QUEUE_SOURCE)).limit(1)
  return parseQueueCursor(row?.lastDifferent, today)
}

async function saveCursor(cursor: QueueCursor) {
  const lastDifferent = serializeQueueCursor(cursor)
  await db
    .insert(ingestCursors)
    .values({ source: QUEUE_SOURCE, lastDifferent, updatedAt: new Date() })
    .onConflictDoUpdate({ target: ingestCursors.source, set: { lastDifferent, updatedAt: new Date() } })
}

async function prepareCursor(today: string, authorities: string[]) {
  const parsed = normalizeCursor(await readCursor(today), authorities)
  return normalizeCursor(withBackfillSeed(parsed, today, authorities.length ? historicalBackfillDays() : null), authorities)
}

export async function readIngestQueueStatus() {
  const today = londonDate()
  const authorities = await loadAuthorities()
  const cursor = await prepareCursor(today, authorities)
  return queueProgress(cursor, authorities.length)
}

export async function beginHistoricalBackfill(days: number) {
  const today = londonDate()
  const authorities = await loadAuthorities()
  const cursor = startHistoricalBackfill(normalizeCursor(await readCursor(today), authorities), today, days)
  await saveCursor(cursor)
  return queueProgress(cursor, authorities.length)
}

/**
 * One Vercel invocation makes one PlanIt request, then uses any leftover
 * budget for Idox contact enrichment. The next cron minute continues the queue.
 */
export async function ingestAuthorityBatch(options?: {
  budgetMs?: number
  force?: boolean
  source?: IngestSourceId
  now?: Date
}) {
  const now = options?.now ?? new Date()
  const today = londonDate(now)
  const authorities = await loadAuthorities()
  const cursor = await prepareCursor(today, authorities)
  if (!options?.force && !isIngestSlot(now)) {
    return resultFor(cursor, authorities.length, {
      ok: true,
      skipped: 'outside window',
      partial: false,
      processed: [],
      failed: [],
    })
  }
  const started = Date.now()
  const budgetMs = options?.budgetMs ?? Number(process.env.INGEST_BUDGET_MS || 45_000)
  const capDays = backfillCapDays()
  const work = pickWork(cursor, authorities, now, today, capDays)
  if (work.kind === 'skip') {
    if (serializeQueueCursor(cursor) !== serializeQueueCursor(await readCursor(today))) await saveCursor(cursor)
    return resultFor(cursor, authorities.length, {
      ok: true,
      skipped: work.reason,
      partial: false,
      processed: [],
      failed: [],
    })
  }
  if (work.kind === 'wait') {
    await saveCursor(cursor)
    return resultFor(cursor, authorities.length, {
      ok: true,
      skipped: false,
      partial: false,
      processed: [],
      failed: [],
    })
  }
  await saveCursor(cursor)
  let next = cursor
  const processed: string[] = []
  const failed: { authority: string; error: string }[] = []
  try {
    const run = await startIngestRun({
      authority: work.authority,
      from: work.from,
      index: work.offset,
      maxPages: 1,
      pageSize: PLANIT_PAGE_SIZE,
      source: options?.source ?? 'planit',
      enrich: false,
      planIt: { maxAttempts: 1, minIntervalMs: 0 },
    })
    const summary = await run.done
    next = applyPageOutcome(
      cursor,
      authorities,
      { ok: true, authority: work.authority, hasMore: summary.hasMore, nextOffset: summary.nextOffset },
      now,
      today,
    )
    processed.push(work.authority)
  } catch (error) {
    const statusCode = typeof error === 'object' && error && 'statusCode' in error ? Number((error as { statusCode?: number }).statusCode) : 0
    if (statusCode === 409) {
      return resultFor(cursor, authorities.length, {
        ok: true,
        skipped: 'busy',
        partial: false,
        processed: [],
        failed: [],
      })
    }
    const message = error instanceof Error ? error.message : 'Authority scan failed'
    next = applyPageOutcome(cursor, authorities, { ok: false, authority: work.authority, error: message }, now, today)
    failed.push({ authority: work.authority, error: message })
  }
  await saveCursor(next)
  const remaining = budgetMs - (Date.now() - started)
  if (remaining >= ENRICH_MIN_REMAINING_MS) {
    try {
      const limit = Math.max(1, Math.min(5, Math.floor(remaining / ENRICH_MIN_REMAINING_MS)))
      await enrichMissingContacts({ limit, deadlineMs: started + budgetMs })
    } catch (error) {
      console.error('PlanIt contact enrichment pass failed', error)
    }
  }
  return resultFor(next, authorities.length, {
    ok: failed.length === 0,
    skipped: false,
    partial: failed.length > 0,
    processed,
    failed,
  })
}
