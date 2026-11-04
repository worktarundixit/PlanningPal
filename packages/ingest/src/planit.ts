import type { FetchQuery, PlanItRecord, PlanningSource, RawPage } from './types.ts'

export const PLANIT_USER_AGENT = 'PlanningPal/0.1 (Hitcaliber Ltd; planning-data ingestion; mailto:alerts@aecpipeline.co.uk; +https://aecpipeline.co.uk)'
export const PLANIT_DAILY_CAP = 300
export const PLANIT_POLITE_INTERVAL_MS = 60_000
const ENDPOINT = 'https://www.planit.org.uk/api/applics/json'

export type PlanItOptions = {
  minIntervalMs?: number
  maxRetryWaitMs?: number
  fetchImpl?: typeof fetch
  now?: () => number
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let sharedLastRequestAt = 0

export function resetPlanItPacing() {
  sharedLastRequestAt = 0
}

export function isPlanItOvernightWindow(date = new Date()) {
  const hourText = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(date)
  const hour = Number(hourText)
  return hour >= 18 || hour < 6
}

export function parseRetryAfterMs(header: string | null | undefined, fallbackMs: number, maxWaitMs = 65_000, nowMs = Date.now()) {
  if (!header) return Math.min(fallbackMs, maxWaitMs)
  const trimmed = header.trim()
  const seconds = Number(trimmed)
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(Math.max(1000, Math.round(seconds * 1000)), maxWaitMs)
  }
  const dateMs = Date.parse(trimmed)
  if (Number.isFinite(dateMs)) {
    const delta = dateMs - nowMs
    return Math.min(Math.max(1000, delta), maxWaitMs)
  }
  return Math.min(fallbackMs, maxWaitMs)
}

export function planItUrl(query: FetchQuery, index: number) {
  const params = new URLSearchParams()
  params.set('pg_sz', String(query.pageSize ?? 300))
  params.set('index', String(index))
  params.set('compress', 'on')
  if (query.from) params.set('start_date', query.from)
  if (query.to) params.set('end_date', query.to)
  if (!query.from && !query.to && query.recentDays) params.set('recent', String(query.recentDays))
  if (query.authority) params.set('auth', query.authority)
  return `${ENDPOINT}?${params.toString()}`
}

async function getJson(url: string, fetchImpl: typeof fetch, maxRetryWaitMs: number) {
  let lastError: unknown
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        headers: { Accept: 'application/json', 'User-Agent': PLANIT_USER_AGENT },
      })
      if (response.status === 429) {
        const retryAfter = response.headers?.get?.('retry-after') ?? null
        const waitMs = parseRetryAfterMs(retryAfter, 15_000 * 2 ** attempt, maxRetryWaitMs)
        const err = new Error(`PlanIt responded 429${retryAfter ? ` (Retry-After: ${retryAfter}s)` : ''}`)
        ;(err as Error & { retryAfterMs?: number; status?: number }).retryAfterMs = waitMs
        ;(err as Error & { status?: number }).status = 429
        throw err
      }
      if (response.status >= 500) {
        throw new Error(`PlanIt responded ${response.status}`)
      }
      if (!response.ok) throw new Error(`PlanIt responded ${response.status}`)
      return await response.json() as { records?: PlanItRecord[]; total?: number | null; from?: number | null }
    } catch (error) {
      lastError = error
      if (attempt === 3) break
      const customWait = error instanceof Error && 'retryAfterMs' in error && typeof error.retryAfterMs === 'number'
        ? error.retryAfterMs
        : Math.min(1000 * 2 ** attempt, maxRetryWaitMs)
      await sleep(customWait)
    }
  }
  throw lastError instanceof Error ? lastError : new Error('PlanIt request failed')
}

export function createPlanItSource(options: PlanItOptions = {}): PlanningSource {
  const fetchImpl = options.fetchImpl ?? fetch
  const envInterval = process.env.PLANIT_MIN_INTERVAL_MS ? Number(process.env.PLANIT_MIN_INTERVAL_MS) : undefined
  const interval = options.minIntervalMs ?? (Number.isFinite(envInterval) ? envInterval! : 2000)
  const maxRetryWaitMs = options.maxRetryWaitMs ?? 30_000
  const now = options.now ?? Date.now
  return {
    id: 'planit',
    async *fetchPages(query) {
      const pageSize = query.pageSize ?? 300
      const maxPages = query.maxPages ?? 40
      let index = 0
      let total: number | null = null
      for (let page = 0; page < maxPages; page += 1) {
        const wait = interval - (now() - sharedLastRequestAt)
        if (sharedLastRequestAt && wait > 0) await sleep(wait)
        const url = planItUrl(query, index)
        sharedLastRequestAt = now()
        const body = await getJson(url, fetchImpl, maxRetryWaitMs)
        const records = Array.isArray(body.records) ? body.records : []
        total = typeof body.total === 'number' ? body.total : total
        const raw: RawPage = { url, body, records, total, from: typeof body.from === 'number' ? body.from : index }
        yield raw
        if (records.length === 0) return
        index += records.length
        if (total !== null && index >= total) return
        if (records.length < pageSize) return
      }
    },
  }
}
