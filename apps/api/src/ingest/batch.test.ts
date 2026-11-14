import { beforeAll, describe, expect, it, vi } from 'vitest'
import { PLANIT_DAILY_CAP } from '@planningpal/ingest'

vi.mock('./run.ts', () => ({
  startIngestRun: vi.fn(),
  enrichMissingContacts: vi.fn(async () => ({ scanned: 0, enriched: 0 })),
}))

import { eq } from 'drizzle-orm'
import { db } from '../db/client.ts'
import { runMigrations } from '../db/migrate.ts'
import { ingestCursors } from '../db/schema.ts'
import { ingestAuthorityBatch } from './batch.ts'
import {
  applyPageOutcome,
  backoffDelayMs,
  historicalBackfillDays,
  incrementalStartDate,
  parseQueueCursor,
  pickWork,
  serializeQueueCursor,
  withBackfillSeed,
  type QueueCursor,
} from './queue.ts'
import { startIngestRun } from './run.ts'

const today = '2026-11-14'
const now = new Date('2026-11-14T12:00:00Z')
const authorities = ['Alpha', 'Beta', 'Gamma']

function cursor(partial: Partial<QueueCursor> = {}): QueueCursor {
  return {
    index: 0,
    since: {},
    retry: {},
    day: today,
    requestsToday: 0,
    ...partial,
  }
}

describe('planit import queue', () => {
  it('parses a legacy numeric cursor into the JSON queue', () => {
    const parsed = parseQueueCursor('4', today)
    expect(parsed.index).toBe(4)
    expect(parsed.since).toEqual({})
    expect(parsed.retry).toEqual({})
    expect(parsed.requestsToday).toBe(0)
    expect(parsed.day).toBe(today)
    expect(JSON.parse(serializeQueueCursor(parsed))).toMatchObject({ index: 4, day: today, requestsToday: 0 })
  })

  it('resets the daily count when the London day changes', () => {
    const raw = JSON.stringify({
      index: 2,
      since: { Alpha: '2026-11-13' },
      retry: {},
      day: '2026-11-13',
      requestsToday: PLANIT_DAILY_CAP,
    })
    const parsed = parseQueueCursor(raw, today)
    expect(parsed.index).toBe(2)
    expect(parsed.requestsToday).toBe(0)
    expect(parsed.day).toBe(today)
    expect(parsed.since.Alpha).toBe('2026-11-13')
  })

  it('builds start_date from since minus one day, capped at 14 days', () => {
    expect(incrementalStartDate('2026-11-13', today, 14)).toBe('2026-11-12')
    expect(incrementalStartDate('2026-10-01', today, 14)).toBe('2026-10-31')
    expect(incrementalStartDate(undefined, today, 14)).toBe('2026-10-31')
    expect(historicalBackfillDays({} as NodeJS.ProcessEnv)).toBe(15)
    expect(historicalBackfillDays({ INGEST_BACKFILL_FROM_DAYS: '0' } as NodeJS.ProcessEnv)).toBeNull()
    expect(historicalBackfillDays({ INGEST_BACKFILL_FROM_DAYS: '90' } as NodeJS.ProcessEnv)).toBe(15)
  })

  it('keeps a mid-authority resume offset and writes since only after the last page', () => {
    let state = cursor({ resume: { authority: 'Beta', offset: 300 }, index: 0, since: { Alpha: today } })
    expect(pickWork(state, authorities, now, today, 14)).toMatchObject({
      kind: 'fetch',
      authority: 'Beta',
      offset: 300,
      mode: 'incremental',
    })
    state = applyPageOutcome(state, authorities, { ok: true, authority: 'Beta', hasMore: true, nextOffset: 600 }, now, today)
    expect(state.resume).toEqual({ authority: 'Beta', offset: 600 })
    expect(state.since.Beta).toBeUndefined()
    state = applyPageOutcome(state, authorities, { ok: true, authority: 'Beta', hasMore: false, nextOffset: 640 }, now, today)
    expect(state.resume).toBeUndefined()
    expect(state.since.Beta).toBe(today)
    expect(state.index).toBe(2)
  })

  it('records backoff on failure and does not pick that authority again until it is due', () => {
    expect(backoffDelayMs(1)).toBe(5 * 60_000)
    expect(backoffDelayMs(2)).toBe(15 * 60_000)
    expect(backoffDelayMs(3)).toBe(30 * 60_000)
    expect(backoffDelayMs(4)).toBe(60 * 60_000)
    expect(backoffDelayMs(5)).toBe(60 * 60_000)
    const failed = applyPageOutcome(cursor(), authorities, { ok: false, authority: 'Alpha', error: 'PlanIt responded 429' }, now, today)
    expect(failed.index).toBe(1)
    expect(failed.retry.Alpha?.attempts).toBe(1)
    expect(Date.parse(failed.retry.Alpha?.availableAt ?? '') - now.getTime()).toBe(5 * 60_000)
    expect(pickWork(failed, authorities, now, today, 14)).toMatchObject({ kind: 'fetch', authority: 'Beta' })
    const waiting = {
      ...failed,
      since: { ...failed.since, Beta: today, Gamma: today },
    }
    expect(pickWork(waiting, authorities, now, today, 14)).toEqual({ kind: 'wait' })
    const later = new Date(now.getTime() + 5 * 60_000)
    expect(pickWork(waiting, authorities, later, today, 14)).toMatchObject({ kind: 'fetch', authority: 'Alpha', mode: 'retry' })
  })

  it('skips once the London-day cap is reached', () => {
    const state = cursor({ requestsToday: PLANIT_DAILY_CAP, since: {} })
    expect(pickWork(state, authorities, now, today, 14)).toEqual({ kind: 'skip', reason: 'daily cap' })
  })

  it('walks every authority in a 15-day backfill, then switches to the daily import', () => {
    let state = withBackfillSeed(cursor(), today, 15)
    expect(state.backfill?.from).toBe('2026-10-30')
    for (const authority of authorities) {
      const work = pickWork(state, authorities, now, today, 14)
      expect(work).toMatchObject({ kind: 'fetch', authority, from: '2026-10-30', mode: 'backfill', offset: 0 })
      state = applyPageOutcome(state, authorities, { ok: true, authority, hasMore: false, nextOffset: 12 }, now, today)
      expect(state.since[authority]).toBe(today)
    }
    expect(state.backfill).toBeUndefined()
    expect(pickWork(state, authorities, now, today, 14)).toEqual({ kind: 'skip', reason: 'up to date' })
    const nextDay = '2026-11-15'
    const rolled = parseQueueCursor(serializeQueueCursor(state), nextDay)
    expect(pickWork(rolled, authorities, new Date('2026-11-15T08:00:00Z'), nextDay, 14)).toMatchObject({
      kind: 'fetch',
      mode: 'incremental',
      from: '2026-11-13',
    })
  })

  it('returns up to date when every authority was imported today and nothing is pending', () => {
    const state = cursor({ since: { Alpha: today, Beta: today, Gamma: today }, index: 0 })
    expect(pickWork(state, authorities, now, today, 14)).toEqual({ kind: 'skip', reason: 'up to date' })
  })
})

describe('authority batch persistence', () => {
  beforeAll(async () => {
    await runMigrations()
  })

  it('advances the cursor and writes a retry when PlanIt returns 429', async () => {
    const previous = process.env.INGEST_BACKFILL_FROM_DAYS
    process.env.INGEST_BACKFILL_FROM_DAYS = '0'
    await db.delete(ingestCursors).where(eq(ingestCursors.source, 'planit-authorities'))
    vi.mocked(startIngestRun).mockImplementation(async () => {
      const done = Promise.reject(new Error('PlanIt responded 429'))
      done.catch(() => undefined)
      return { id: 'run', status: 'running', done }
    })
    try {
      const result = await ingestAuthorityBatch({ force: true, budgetMs: 1_000 })
      expect(result.partial).toBe(true)
      expect(result.ok).toBe(false)
      expect(result.processed).toEqual([])
      expect(result.failed).toEqual([{ authority: expect.any(String), error: 'PlanIt responded 429' }])
      const [row] = await db.select().from(ingestCursors).where(eq(ingestCursors.source, 'planit-authorities'))
      const saved = JSON.parse(row?.lastDifferent ?? '{}') as QueueCursor
      expect(saved.index).toBe(1)
      expect(saved.requestsToday).toBe(1)
      const authority = result.failed[0]?.authority ?? ''
      expect(saved.retry[authority]?.attempts).toBe(1)
      expect(saved.retry[authority]?.error).toBe('PlanIt responded 429')
      expect(Date.parse(saved.retry[authority]?.availableAt ?? '')).toBeGreaterThan(Date.now())
    } finally {
      if (previous === undefined) delete process.env.INGEST_BACKFILL_FROM_DAYS
      else process.env.INGEST_BACKFILL_FROM_DAYS = previous
    }
  })
})
