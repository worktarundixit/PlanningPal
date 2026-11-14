import { PLANIT_DAILY_CAP } from '@planningpal/ingest'

export const QUEUE_SOURCE = 'planit-authorities'
export const ENRICH_CURSOR_SOURCE = 'planit-enrich'
export const DEFAULT_INCREMENTAL_CAP_DAYS = 14
export const DEFAULT_HISTORICAL_BACKFILL_DAYS = 15
export const MAX_HISTORICAL_BACKFILL_DAYS = 15
export const PLANIT_PAGE_SIZE = 300

const BACKOFF_MS = [5, 15, 30, 60].map((minutes) => minutes * 60_000)

export type RetryState = {
  attempts: number
  availableAt: string
  error: string
}

export type QueueCursor = {
  index: number
  resume?: { authority: string; offset: number }
  since: Record<string, string>
  retry: Record<string, RetryState>
  day: string
  requestsToday: number
  backfill?: { from: string; done: Record<string, true> }
}

export type QueueWork =
  | { kind: 'skip'; reason: 'daily cap' | 'up to date' }
  | { kind: 'wait' }
  | { kind: 'fetch'; authority: string; offset: number; from: string; mode: 'backfill' | 'incremental' | 'retry' }

export type PageOutcome =
  | { ok: true; authority: string; hasMore: boolean; nextOffset: number }
  | { ok: false; authority: string; error: string }

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

export function londonDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function addDays(isoDay: string, days: number) {
  const [year, month, day] = isoDay.split('-').map(Number)
  const utc = new Date(Date.UTC(year || 1970, (month || 1) - 1, day || 1))
  utc.setUTCDate(utc.getUTCDate() + days)
  return utc.toISOString().slice(0, 10)
}

export function backoffDelayMs(attempts: number) {
  const index = Math.min(BACKOFF_MS.length - 1, Math.max(0, Math.floor(attempts) - 1))
  return BACKOFF_MS[index] ?? BACKOFF_MS[BACKOFF_MS.length - 1] ?? 60 * 60_000
}

export function backfillCapDays(env: NodeJS.ProcessEnv = process.env) {
  const parsed = Number(env.INGEST_BACKFILL_DAYS ?? DEFAULT_INCREMENTAL_CAP_DAYS)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_INCREMENTAL_CAP_DAYS
  return Math.floor(parsed)
}

export function clampHistoricalDays(days: number) {
  if (!Number.isFinite(days)) return DEFAULT_HISTORICAL_BACKFILL_DAYS
  return Math.min(MAX_HISTORICAL_BACKFILL_DAYS, Math.max(1, Math.floor(days)))
}

/** Unset defaults to 15. `0` turns the automatic one-time backfill off. Values above 15 are capped. */
export function historicalBackfillDays(env: NodeJS.ProcessEnv = process.env): number | null {
  const raw = env.INGEST_BACKFILL_FROM_DAYS
  if (raw === undefined || raw === '') return DEFAULT_HISTORICAL_BACKFILL_DAYS
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return clampHistoricalDays(parsed)
}

export function incrementalStartDate(since: string | undefined, today: string, capDays = DEFAULT_INCREMENTAL_CAP_DAYS) {
  const cap = addDays(today, -capDays)
  if (!since || !ISO_DAY.test(since)) return cap
  const overlapped = addDays(since, -1)
  return overlapped < cap ? cap : overlapped
}

function emptyCursor(today: string): QueueCursor {
  return { index: 0, since: {}, retry: {}, day: today, requestsToday: 0 }
}

function parseSince(value: unknown) {
  const since: Record<string, string> = {}
  if (!value || typeof value !== 'object') return since
  for (const [authority, day] of Object.entries(value as Record<string, unknown>)) {
    if (typeof day === 'string' && ISO_DAY.test(day)) since[authority] = day
  }
  return since
}

function parseRetry(value: unknown) {
  const retry: Record<string, RetryState> = {}
  if (!value || typeof value !== 'object') return retry
  for (const [authority, entry] of Object.entries(value as Record<string, unknown>)) {
    if (!entry || typeof entry !== 'object') continue
    const item = entry as Record<string, unknown>
    const attempts = Number(item.attempts)
    if (!Number.isFinite(attempts) || attempts < 1 || typeof item.availableAt !== 'string' || !item.availableAt) continue
    retry[authority] = {
      attempts: Math.floor(attempts),
      availableAt: item.availableAt,
      error: typeof item.error === 'string' ? item.error : '',
    }
  }
  return retry
}

function parseResume(value: unknown): QueueCursor['resume'] {
  if (!value || typeof value !== 'object') return undefined
  const item = value as Record<string, unknown>
  const offset = Number(item.offset)
  if (typeof item.authority !== 'string' || !item.authority || !Number.isFinite(offset) || offset < 0) return undefined
  return { authority: item.authority, offset: Math.floor(offset) }
}

function parseBackfill(value: unknown): QueueCursor['backfill'] {
  if (!value || typeof value !== 'object') return undefined
  const item = value as Record<string, unknown>
  if (typeof item.from !== 'string' || !ISO_DAY.test(item.from)) return undefined
  const done: Record<string, true> = {}
  if (item.done && typeof item.done === 'object') {
    for (const [authority, flag] of Object.entries(item.done as Record<string, unknown>)) {
      if (flag === true) done[authority] = true
    }
  }
  return { from: item.from, done }
}

export function parseQueueCursor(raw: string | null | undefined, today: string): QueueCursor {
  const fallback = emptyCursor(today)
  const trimmed = raw?.trim() ?? ''
  if (!trimmed) return fallback
  if (/^\d+$/.test(trimmed)) return { ...fallback, index: Number(trimmed) }
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fallback
    const storedDay = typeof parsed.day === 'string' && ISO_DAY.test(parsed.day) ? parsed.day : today
    const sameDay = storedDay === today
    const index = Number(parsed.index)
    const resume = parseResume(parsed.resume)
    const backfill = parseBackfill(parsed.backfill)
    return {
      index: Number.isFinite(index) && index >= 0 ? Math.floor(index) : 0,
      ...(resume ? { resume } : {}),
      since: parseSince(parsed.since),
      retry: parseRetry(parsed.retry),
      day: today,
      requestsToday: sameDay && Number.isFinite(Number(parsed.requestsToday)) ? Math.max(0, Math.floor(Number(parsed.requestsToday))) : 0,
      ...(backfill ? { backfill } : {}),
    }
  } catch {
    return fallback
  }
}

export function serializeQueueCursor(cursor: QueueCursor) {
  const ordered: Record<string, unknown> = { index: cursor.index }
  if (cursor.resume) ordered.resume = cursor.resume
  ordered.since = cursor.since
  ordered.retry = cursor.retry
  ordered.day = cursor.day
  ordered.requestsToday = cursor.requestsToday
  if (cursor.backfill) ordered.backfill = cursor.backfill
  return JSON.stringify(ordered)
}

export function withBackfillSeed(cursor: QueueCursor, today: string, days: number | null): QueueCursor {
  if (cursor.backfill || days == null || days <= 0) return cursor
  if (Object.keys(cursor.since).length > 0) return cursor
  return {
    ...cursor,
    backfill: { from: addDays(today, -clampHistoricalDays(days)), done: {} },
  }
}

export function startHistoricalBackfill(cursor: QueueCursor, today: string, days: number): QueueCursor {
  const next: QueueCursor = {
    ...cursor,
    since: { ...cursor.since },
    retry: { ...cursor.retry },
    backfill: { from: addDays(today, -clampHistoricalDays(days)), done: {} },
  }
  delete next.resume
  return next
}

function cloneCursor(cursor: QueueCursor): QueueCursor {
  return {
    index: cursor.index,
    ...(cursor.resume ? { resume: { ...cursor.resume } } : {}),
    since: { ...cursor.since },
    retry: Object.fromEntries(Object.entries(cursor.retry).map(([authority, state]) => [authority, { ...state }])),
    day: cursor.day,
    requestsToday: cursor.requestsToday,
    ...(cursor.backfill ? { backfill: { from: cursor.backfill.from, done: { ...cursor.backfill.done } } } : {}),
  }
}

function advancePast(cursor: QueueCursor, authorities: string[], authority: string) {
  const at = authorities.indexOf(authority)
  if (at < 0 || authorities.length === 0) return
  cursor.index = at + 1 >= authorities.length ? 0 : at + 1
}

export function normalizeCursor(cursor: QueueCursor, authorities: string[]) {
  const next = cloneCursor(cursor)
  if (authorities.length === 0 || next.index < 0 || next.index >= authorities.length) next.index = 0
  if (next.resume && !authorities.includes(next.resume.authority)) delete next.resume
  if (next.backfill && authorities.length > 0 && authorities.every((authority) => next.backfill?.done[authority])) {
    delete next.backfill
  }
  return next
}

function futureRetry(cursor: QueueCursor, authority: string, nowMs: number) {
  const retry = cursor.retry[authority]
  return !!retry && Date.parse(retry.availableAt) > nowMs
}

function startDateFor(cursor: QueueCursor, authority: string, today: string, capDays: number) {
  if (cursor.backfill && !cursor.backfill.done[authority]) return cursor.backfill.from
  return incrementalStartDate(cursor.since[authority], today, capDays)
}

export function pickWork(cursor: QueueCursor, authorities: string[], now: Date, today: string, capDays = DEFAULT_INCREMENTAL_CAP_DAYS): QueueWork {
  if (cursor.requestsToday >= PLANIT_DAILY_CAP) return { kind: 'skip', reason: 'daily cap' }
  if (authorities.length === 0) return { kind: 'skip', reason: 'up to date' }
  const nowMs = now.getTime()
  const due = authorities
    .filter((authority) => {
      const retry = cursor.retry[authority]
      return !!retry && Date.parse(retry.availableAt) <= nowMs
    })
    .sort((left, right) => Date.parse(cursor.retry[left]?.availableAt ?? '') - Date.parse(cursor.retry[right]?.availableAt ?? ''))
  if (due[0]) {
    const authority = due[0]
    return {
      kind: 'fetch',
      authority,
      offset: cursor.resume?.authority === authority ? cursor.resume.offset : 0,
      from: startDateFor(cursor, authority, today, capDays),
      mode: 'retry',
    }
  }
  if (cursor.resume && authorities.includes(cursor.resume.authority) && !futureRetry(cursor, cursor.resume.authority, nowMs)) {
    const authority = cursor.resume.authority
    return {
      kind: 'fetch',
      authority,
      offset: cursor.resume.offset,
      from: startDateFor(cursor, authority, today, capDays),
      mode: cursor.backfill && !cursor.backfill.done[authority] ? 'backfill' : 'incremental',
    }
  }
  if (cursor.backfill) {
    const start = authorities.length === 0 ? 0 : cursor.index % authorities.length
    for (let step = 0; step < authorities.length; step += 1) {
      const authority = authorities[(start + step) % authorities.length]
      if (!authority || cursor.backfill.done[authority] || futureRetry(cursor, authority, nowMs)) continue
      return { kind: 'fetch', authority, offset: 0, from: cursor.backfill.from, mode: 'backfill' }
    }
    if (authorities.some((authority) => !cursor.backfill?.done[authority])) return { kind: 'wait' }
  }
  const start = authorities.length === 0 ? 0 : cursor.index % authorities.length
  for (let step = 0; step < authorities.length; step += 1) {
    const authority = authorities[(start + step) % authorities.length]
    if (!authority || futureRetry(cursor, authority, nowMs) || cursor.since[authority] === today) continue
    return {
      kind: 'fetch',
      authority,
      offset: 0,
      from: incrementalStartDate(cursor.since[authority], today, capDays),
      mode: 'incremental',
    }
  }
  if (authorities.some((authority) => futureRetry(cursor, authority, nowMs))) return { kind: 'wait' }
  return { kind: 'skip', reason: 'up to date' }
}

export function applyPageOutcome(cursor: QueueCursor, authorities: string[], outcome: PageOutcome, now: Date, today: string): QueueCursor {
  const next = cloneCursor(cursor)
  next.requestsToday += 1
  if (!outcome.ok) {
    const attempts = (next.retry[outcome.authority]?.attempts ?? 0) + 1
    next.retry[outcome.authority] = {
      attempts,
      availableAt: new Date(now.getTime() + backoffDelayMs(attempts)).toISOString(),
      error: outcome.error,
    }
    advancePast(next, authorities, outcome.authority)
    return next
  }
  delete next.retry[outcome.authority]
  if (outcome.hasMore) {
    next.resume = { authority: outcome.authority, offset: outcome.nextOffset }
    return next
  }
  if (next.resume?.authority === outcome.authority) delete next.resume
  next.since[outcome.authority] = today
  if (next.backfill) {
    next.backfill.done[outcome.authority] = true
    if (authorities.length > 0 && authorities.every((authority) => next.backfill?.done[authority])) delete next.backfill
  }
  advancePast(next, authorities, outcome.authority)
  return next
}

export function queueProgress(cursor: QueueCursor, total: number) {
  return {
    day: cursor.day,
    requestsToday: cursor.requestsToday,
    dailyCap: PLANIT_DAILY_CAP,
    index: cursor.index,
    total,
    backfill: cursor.backfill
      ? { from: cursor.backfill.from, done: Object.keys(cursor.backfill.done).length, total }
      : null,
  }
}

export function pageContinues(records: number, total: number | null, from: number, pageSize: number) {
  if (records <= 0) return false
  const nextOffset = from + records
  if (total !== null && nextOffset >= total) return false
  return records >= pageSize
}
