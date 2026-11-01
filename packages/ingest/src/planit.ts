import type { FetchQuery, PlanItRecord, PlanningSource, RawPage } from './types.ts'

export const PLANIT_USER_AGENT = 'PlanningPal/0.1 (Hitcaliber Ltd; planning-data ingestion; +https://aecpipeline.co.uk)'
const ENDPOINT = 'https://www.planit.org.uk/api/applics/json'

export type PlanItOptions = {
  minIntervalMs?: number
  fetchImpl?: typeof fetch
  now?: () => number
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function planItUrl(query: FetchQuery, index: number) {
  const params = new URLSearchParams()
  params.set('pg_sz', String(query.pageSize ?? 300))
  params.set('index', String(index))
  if (query.from) params.set('start_date', query.from)
  if (query.to) params.set('end_date', query.to)
  if (!query.from && !query.to && query.recentDays) params.set('recent', String(query.recentDays))
  if (query.authority) params.set('auth', query.authority)
  return `${ENDPOINT}?${params.toString()}`
}

async function getJson(url: string, fetchImpl: typeof fetch) {
  let lastError: unknown
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        headers: { Accept: 'application/json', 'User-Agent': PLANIT_USER_AGENT },
      })
      if (response.status === 429 || response.status >= 500) {
        throw new Error(`PlanIt responded ${response.status}`)
      }
      if (!response.ok) throw new Error(`PlanIt responded ${response.status}`)
      return await response.json() as { records?: PlanItRecord[]; total?: number | null; from?: number | null }
    } catch (error) {
      lastError = error
      if (attempt === 3) break
      await sleep(1000 * 2 ** attempt)
    }
  }
  throw lastError instanceof Error ? lastError : new Error('PlanIt request failed')
}

export function createPlanItSource(options: PlanItOptions = {}): PlanningSource {
  const fetchImpl = options.fetchImpl ?? fetch
  const interval = options.minIntervalMs ?? 2000
  let lastRequest = 0
  return {
    id: 'planit',
    async *fetchPages(query) {
      const pageSize = query.pageSize ?? 300
      const maxPages = query.maxPages ?? 40
      let index = 0
      let total: number | null = null
      for (let page = 0; page < maxPages; page += 1) {
        const wait = interval - (Date.now() - lastRequest)
        if (lastRequest && wait > 0) await sleep(wait)
        const url = planItUrl(query, index)
        lastRequest = Date.now()
        const body = await getJson(url, fetchImpl)
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
