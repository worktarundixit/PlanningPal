import master from './data/uk-lpa-master.json'

export type LpaStatus = 'active' | 'abolished'
export type LpaCoverage = 'available' | 'shared' | 'legacy' | 'unavailable'

export type LpaRecord = {
  name: string
  nation: string
  region: string
  county: string
  type: string
  gssCode: string
  lpaGssCode: string
  planitAreaName: string
  planitAreaId: number | null
  planitCovered: string
  planitScraperType: string
  planitLatestAppDate: string | null
  planitTotalApps: number | null
  planningPortalUrl: string
  website: string
  status: LpaStatus
  endDate: string | null
  successor: string
  notes: string
  coverage: LpaCoverage
  planitQueryAreas: string[]
}

type RawLpa = {
  name: string
  nation: string
  region: string
  county: string
  type: string
  gss_code: string
  lpa_gss_code: string
  planit_area_name: string
  planit_area_id: number | ''
  planit_covered: string
  planit_scraper_type: string
  planit_latest_app_date: string
  planit_total_apps: number | ''
  planning_portal_url: string
  website: string
  status: string
  end_date: string
  successor: string
  notes: string
}

const ENGLAND_REGION: Record<string, string> = {
  'Colchester City Council': 'East of England',
  'Cumberland Council': 'North West',
  'Broads Authority': 'East of England',
  'Dartmoor National Park Authority': 'South West',
  'Exmoor National Park Authority': 'South West',
  'Ebbsfleet Development Corporation': 'South East',
  'Hartlepool Development Corporation': 'North East',
  'Lake District National Park Authority': 'North West',
  'Middlesbrough Development Corporation': 'North East',
  'New Forest National Park Authority': 'South East',
  'North York Moors National Park Authority': 'Yorkshire and the Humber',
  'Northumberland National Park Authority': 'North East',
  'Old Oak and Park Royal Development Corporation': 'London',
  'Peak District National Park Authority': 'East Midlands',
  'South Downs National Park Authority': 'South East',
  'Yorkshire Dales National Park Authority': 'Yorkshire and the Humber',
}

export const LPA_REGIONS = [
  'London',
  'South East',
  'South West',
  'East of England',
  'East Midlands',
  'West Midlands',
  'Yorkshire and the Humber',
  'North East',
  'North West',
  'Scotland',
  'Wales',
  'Northern Ireland',
] as const

function numberOrNull(value: number | '') {
  return typeof value === 'number' ? value : null
}

function regionFor(row: RawLpa) {
  if (ENGLAND_REGION[row.name]) return ENGLAND_REGION[row.name]
  if (row.region === 'Yorkshire and The Humber') return 'Yorkshire and the Humber'
  if (row.region) return row.region
  if (row.nation === 'Scotland' || row.nation === 'Wales' || row.nation === 'Northern Ireland') return row.nation
  return 'England'
}

function coverageFor(covered: string): LpaCoverage {
  if (covered === 'no' || covered === '') return 'unavailable'
  if (covered.includes('legacy')) return 'legacy'
  if (covered.includes('shared')) return 'shared'
  return 'available'
}

function queryAreas(row: RawLpa): string[] {
  if (row.planit_covered === 'no' || row.planit_covered === '') return []
  if (row.planit_covered.includes('legacy')) return ['Allerdale', 'Carlisle', 'Copeland']
  const shared = row.notes.match(/PlanIt area '([^']+)'/)
  if (shared?.[1]) return [shared[1]]
  return row.planit_area_name ? [row.planit_area_name] : []
}

export const LPA_RECORDS: LpaRecord[] = (master as RawLpa[]).map((row) => ({
  name: row.name,
  nation: row.nation,
  region: regionFor(row),
  county: row.county,
  type: row.type,
  gssCode: row.gss_code,
  lpaGssCode: row.lpa_gss_code,
  planitAreaName: row.planit_area_name,
  planitAreaId: numberOrNull(row.planit_area_id),
  planitCovered: row.planit_covered,
  planitScraperType: row.planit_scraper_type,
  planitLatestAppDate: row.planit_latest_app_date || null,
  planitTotalApps: numberOrNull(row.planit_total_apps),
  planningPortalUrl: row.planning_portal_url,
  website: row.website,
  status: row.status === 'abolished' ? 'abolished' : 'active',
  endDate: row.end_date || null,
  successor: row.successor,
  notes: row.notes,
  coverage: coverageFor(row.planit_covered),
  planitQueryAreas: queryAreas(row),
}))

const byGss = new Map(LPA_RECORDS.map((row) => [row.gssCode, row]))

export function lpaByGss(code: string) {
  return byGss.get(code)
}

export function lpaAreas() {
  const grouped = new Map<string, string[]>()
  for (const region of LPA_REGIONS) grouped.set(region, [])
  for (const row of LPA_RECORDS) {
    if (row.status !== 'active') continue
    const list = grouped.get(row.region) ?? []
    list.push(row.name)
    grouped.set(row.region, list)
  }
  return LPA_REGIONS.map((region) => ({ region, councils: (grouped.get(region) ?? []).sort((a, b) => a.localeCompare(b)) }))
}

/** PlanIt `auth` values for active authorities that have a source, one row per area. */
export function planItIngestAreas(records: LpaRecord[] = LPA_RECORDS) {
  const areas = new Set<string>()
  for (const row of records) {
    if (row.status !== 'active' || row.coverage === 'unavailable') continue
    for (const area of row.planitQueryAreas) areas.add(area)
  }
  return [...areas].sort((a, b) => a.localeCompare(b))
}

export function feedHealth(records: LpaRecord[], options?: { asOf?: Date; staleDays?: number }) {
  const asOf = options?.asOf ?? new Date()
  const staleDays = options?.staleDays ?? 90
  const cutoff = asOf.getTime() - staleDays * 24 * 60 * 60 * 1000
  const active = records.filter((row) => row.status === 'active')
  const unavailable = active.filter((row) => row.coverage === 'unavailable')
  const stale = active.filter((row) => {
    if (!row.planitLatestAppDate) return false
    const parsed = Date.parse(row.planitLatestAppDate)
    return Number.isFinite(parsed) && parsed < cutoff
  })
  return {
    active: active.length,
    abolished: records.length - active.length,
    planitCovered: active.filter((row) => row.coverage !== 'unavailable').length,
    unavailable: unavailable.map((row) => ({ name: row.name, gssCode: row.gssCode, coverage: 'coverage unavailable' as const })),
    stale: stale
      .map((row) => ({ name: row.name, gssCode: row.gssCode, latest: row.planitLatestAppDate }))
      .sort((a, b) => (a.latest ?? '').localeCompare(b.latest ?? '')),
    staleDays,
  }
}
