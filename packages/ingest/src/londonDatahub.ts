import { PLANIT_USER_AGENT, createPlanItSource, type PlanItOptions } from './planit.ts'
import type { FetchQuery, PlanItRecord, PlanningSource, RawPage } from './types.ts'

export const LONDON_DATAHUB_ENDPOINT = 'https://planningdata.london.gov.uk/api-guest/applications/_search'
const LONDON_ALLOW_HEADER = 'be2rmRnt&'

export type LondonDatahubRecord = {
  id?: string | null
  lpa_name?: string | null
  borough?: string | null
  lpa_app_no?: string | null
  description?: string | null
  status?: string | null
  decision?: string | null
  valid_date?: string | null
  decision_date?: string | null
  postcode?: string | null
  site_number?: string | number | null
  site_name?: string | null
  street_name?: string | null
  secondary_street_name?: string | null
  locality?: string | null
  url_planning_app?: string | null
  application_type?: string | null
  application_type_full?: string | null
  development_type?: string | null
  last_updated?: string | null
  last_synced?: string | null
  centroid?: { lat?: number | null; lon?: number | null } | null
  application_details?: Record<string, unknown> | null
}

function parseUkDateToIso(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = String(value).trim()
  const slash = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (slash?.[1] && slash[2] && slash[3]) {
    const year = Number(slash[3])
    if (year < 2000 || year > 2100) return null
    return `${slash[3]}-${slash[2]}-${slash[1]}`
  }
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso?.[1] && iso[2] && iso[3]) {
    const year = Number(iso[1])
    if (year < 2000 || year > 2100) return null
    return `${iso[1]}-${iso[2]}-${iso[3]}`
  }
  return null
}

function buildAddress(source: LondonDatahubRecord): string {
  const parts = [
    source.site_name ? String(source.site_name).trim() : '',
    [source.site_number ? String(source.site_number).trim() : '', source.street_name ? String(source.street_name).trim() : '']
      .filter(Boolean)
      .join(' '),
    source.locality ? String(source.locality).trim() : 'London',
    source.postcode ? String(source.postcode).trim() : '',
  ].filter(Boolean)
  const deduped: string[] = []
  for (const part of parts) {
    if (!deduped.some((existing) => existing.toLowerCase().includes(part.toLowerCase()))) {
      deduped.push(part)
    }
  }
  return deduped.join(', ')
}

export function mapLondonDatahubHit(source: LondonDatahubRecord): PlanItRecord | null {
  const area = (source.lpa_name || source.borough || '').replace(/^London Borough of\s+/i, '').trim()
  const uid = (source.lpa_app_no || '').trim()
  if (!area || !uid) return null
  const details = source.application_details && typeof source.application_details === 'object' ? source.application_details : {}
  const applicant = String(
    details.lead_developer_company_name ?? details.applicant_company ?? details.applicant_name ?? '',
  ).trim()
  const agentCompany = String(details.agent_company ?? details.agent_company_name ?? '').trim()
  const agentName = String(details.agent_name ?? '').trim()
  const agentAddress = String(details.agent_address ?? '').trim()
  const startDate = parseUkDateToIso(source.valid_date) ?? (source.last_updated ? source.last_updated.slice(0, 10) : null)
  const decidedDate = parseUkDateToIso(source.decision_date)
  const state = (source.decision || source.status || 'Undecided').trim()
  const fullType = (source.application_type_full || source.application_type || 'Full').trim()
  const lat = typeof source.centroid?.lat === 'number' ? source.centroid.lat : null
  const lon = typeof source.centroid?.lon === 'number' ? source.centroid.lon : null
  return {
    name: `${area}/${uid}`,
    uid,
    reference: uid,
    area_name: area,
    address: buildAddress(source),
    postcode: source.postcode ? String(source.postcode).trim() : null,
    description: source.description ?? '',
    app_type: fullType,
    app_size: String(details.development_scale ?? 'Medium'),
    app_state: state,
    start_date: startDate,
    decided_date: decidedDate,
    url: source.url_planning_app ?? null,
    link: source.url_planning_app ?? null,
    last_different: source.last_updated ?? source.last_synced ?? null,
    last_changed: source.last_updated ?? null,
    location_x: lon,
    location_y: lat,
    other_fields: {
      application_type: fullType,
      date_validated: startDate ?? '',
      applicant_name: applicant,
      agent_name: agentName,
      agent_company: agentCompany,
      agent_address: agentAddress,
    },
  }
}

export function buildLondonDatahubBody(query: FetchQuery, fromIndex: number) {
  const size = Math.min(query.pageSize ?? 200, 500)
  const must: Record<string, unknown>[] = []
  if (query.authority) {
    must.push({
      multi_match: {
        query: query.authority,
        fields: ['lpa_name', 'borough'],
      },
    })
  }
  const now = Date.now()
  const sinceIso = query.from
    ? `${query.from}T00:00:00Z`
    : query.recentDays
      ? new Date(now - query.recentDays * 86_400_000).toISOString()
      : new Date(now - 7 * 86_400_000).toISOString()
  const range: Record<string, string> = { gte: sinceIso }
  if (query.to) range.lte = `${query.to}T23:59:59Z`
  must.push({ range: { last_updated: range } })

  return {
    from: fromIndex,
    size,
    sort: [{ last_updated: { order: 'desc' } }],
    query: { bool: { must } },
  }
}

export function createLondonDatahubSource(options: { fetchImpl?: typeof fetch } = {}): PlanningSource {
  const fetchImpl = options.fetchImpl ?? fetch
  return {
    id: 'london-datahub',
    async *fetchPages(query) {
      const pageSize = Math.min(query.pageSize ?? 200, 500)
      const maxPages = query.maxPages ?? 15
      let index = 0
      for (let page = 0; page < maxPages; page += 1) {
        const payload = buildLondonDatahubBody(query, index)
        const response = await fetchImpl(LONDON_DATAHUB_ENDPOINT, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': PLANIT_USER_AGENT,
            'X-API-AllowRequest': LONDON_ALLOW_HEADER,
          },
          body: JSON.stringify(payload),
        })
        if (!response.ok) {
          throw new Error(`London Datahub responded ${response.status}`)
        }
        const json = (await response.json()) as {
          hits?: {
            total?: { value?: number } | number
            hits?: { _source?: LondonDatahubRecord }[]
          }
        }
        const rawHits = json.hits?.hits ?? []
        const total = typeof json.hits?.total === 'number'
          ? json.hits.total
          : typeof json.hits?.total?.value === 'number'
            ? json.hits.total.value
            : null
        const records = rawHits
          .map((hit) => (hit._source ? mapLondonDatahubHit(hit._source) : null))
          .filter((item): item is PlanItRecord => item !== null)
        const raw: RawPage = {
          url: `${LONDON_DATAHUB_ENDPOINT}?from=${index}&size=${pageSize}`,
          body: json,
          records,
          total,
          from: index,
        }
        yield raw
        if (rawHits.length === 0) return
        index += rawHits.length
        if (total !== null && index >= total) return
        if (rawHits.length < pageSize) return
      }
    },
  }
}

/**
 * Hybrid source ("Combo 2"):
 * - Attempts primary PlanIt source with polite rate limiting.
 * - Automatically falls back to GLA London Planning Datahub if PlanIt rate-limits (429) or fails.
 */
export function createHybridPlanningSource(options: PlanItOptions = {}): PlanningSource {
  const planit = createPlanItSource(options)
  const london = createLondonDatahubSource({ fetchImpl: options.fetchImpl })
  return {
    id: 'auto',
    async *fetchPages(query) {
      if (query.source === 'london-datahub') {
        yield* london.fetchPages(query)
        return
      }
      if (query.source === 'planit') {
        yield* planit.fetchPages(query)
        return
      }
      try {
        yield* planit.fetchPages(query)
      } catch (error) {
        const message = error instanceof Error ? error.message : ''
        if (/429|rate|5\d\d|fetch/i.test(message)) {
          yield* london.fetchPages(query)
          return
        }
        throw error
      }
    },
  }
}

