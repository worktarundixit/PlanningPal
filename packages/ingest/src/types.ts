export type PlanItRecord = {
  name?: string | null
  uid?: string | null
  reference?: string | null
  area_name?: string | null
  address?: string | null
  description?: string | null
  app_type?: string | null
  app_size?: string | null
  app_state?: string | null
  start_date?: string | null
  decided_date?: string | null
  link?: string | null
  url?: string | null
  postcode?: string | null
  last_different?: string | null
  last_changed?: string | null
  location_x?: number | null
  location_y?: number | null
  other_fields?: Record<string, unknown> | null
}

export type IngestSourceId = 'planit' | 'london-datahub' | 'auto'

export type FetchQuery = {
  recentDays?: number
  from?: string
  to?: string
  authority?: string
  pageSize?: number
  maxPages?: number
  /** PlanIt `index` offset. A resumed page starts here instead of 0. */
  index?: number
  /** Skip records whose last_different is at or before this ISO timestamp. */
  since?: string
  source?: IngestSourceId
}

export type RawPage = {
  url: string
  body: unknown
  records: PlanItRecord[]
  total: number | null
  from: number | null
}

export interface PlanningSource {
  readonly id: string
  fetchPages(query: FetchQuery): AsyncGenerator<RawPage>
}

export type FilterConfig = {
  dropTypes: string[]
  patterns: { reason: string; source: string }[]
}

export type CleanedRecord = {
  authorityKey: string
  reference: string
  columns: Record<string, string>
  longitude: number | null
  latitude: number | null
  lastDifferent: string
}
