export const ONBOARDING_STEPS = ['workspace', 'profile', 'icp', 'team', 'alerts', 'done'] as const
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number]

export const COVERAGE_TIERS = [
  {
    id: 'regional',
    label: 'Regional',
    detail: '1 UK region. For a firm working in a single territory.',
    planName: 'Regional Leads Feed',
    monthlyPrice: '£99',
    tier: 'REGIONAL',
    minRegions: 1,
    maxRegions: 1,
    maxCouncils: 12,
  },
  {
    id: 'multi_county',
    label: 'Multi County',
    detail: '2 or 3 regions. For firms covering neighbouring counties.',
    planName: 'Multi County Feed',
    monthlyPrice: '£179',
    tier: 'MULTI_COUNTY',
    minRegions: 2,
    maxRegions: 3,
    maxCouncils: 24,
  },
  {
    id: 'nationwide',
    label: 'Nationwide',
    detail: 'All 376 UK planning authorities.',
    planName: 'All UK Nationwide',
    monthlyPrice: '£299',
    tier: 'NATIONWIDE',
    minRegions: 12,
    maxRegions: 12,
    maxCouncils: 48,
  },
] as const

export type CoverageId = (typeof COVERAGE_TIERS)[number]['id']

export const UK_AREAS: { region: string; councils: string[] }[] = [
  { region: 'London', councils: ['Camden', 'City of London', 'Hackney', 'Hammersmith and Fulham', 'Islington', 'Kensington and Chelsea', 'Lambeth', 'Southwark', 'Tower Hamlets', 'Wandsworth', 'Westminster'] },
  { region: 'South East', councils: ['Brighton and Hove', 'Buckinghamshire', 'Guildford', 'Oxford', 'Reading', 'Slough', 'Southampton', 'Windsor and Maidenhead', 'Woking'] },
  { region: 'South West', councils: ['Bath and North East Somerset', 'Bristol', 'Cornwall', 'Dorset', 'Exeter', 'Plymouth', 'South Gloucestershire', 'Wiltshire'] },
  { region: 'East of England', councils: ['Cambridge', 'Chelmsford', 'Colchester', 'Luton', 'Norwich', 'Peterborough', 'Southend-on-Sea', 'St Albans'] },
  { region: 'East Midlands', councils: ['Derby', 'Leicester', 'Lincoln', 'Northampton', 'Nottingham'] },
  { region: 'West Midlands', councils: ['Birmingham', 'Coventry', 'Dudley', 'Sandwell', 'Solihull', 'Walsall', 'Wolverhampton', 'Worcester'] },
  { region: 'Yorkshire and the Humber', councils: ['Bradford', 'Kingston upon Hull', 'Leeds', 'Sheffield', 'York'] },
  { region: 'North East', councils: ['County Durham', 'Gateshead', 'Newcastle upon Tyne', 'North Tyneside', 'Sunderland'] },
  { region: 'North West', councils: ['Cheshire East', 'Liverpool', 'Manchester', 'Salford', 'Stockport', 'Trafford', 'Warrington'] },
  { region: 'Scotland', councils: ['Aberdeen City', 'City of Edinburgh', 'Dundee City', 'Glasgow City', 'Highland', 'Perth and Kinross'] },
  { region: 'Wales', councils: ['Cardiff', 'Newport', 'Swansea', 'Vale of Glamorgan', 'Wrexham'] },
  { region: 'Northern Ireland', councils: ['Belfast', 'Derry City and Strabane', 'Lisburn and Castlereagh'] },
]

export const PROJECT_TYPES = ['Residential', 'Commercial', 'Mixed use', 'Industrial', 'Education', 'Healthcare', 'Infrastructure', 'Heritage'] as const
export const VALUE_RANGES = ['£100k–£250k', '£250k–£1m', '£1m–£5m', '£5m+'] as const
export const RIBA_STAGES = [
  { id: '0', label: 'Stage 0', detail: 'Strategic definition' },
  { id: '1', label: 'Stage 1', detail: 'Preparation and briefing' },
  { id: '2', label: 'Stage 2', detail: 'Concept design' },
] as const

export const ALERT_FREQUENCIES = [
  { id: 'immediate', label: 'As leads arrive' },
  { id: 'daily', label: 'Daily digest' },
  { id: 'weekly', label: 'Weekly digest' },
] as const

export type AlertFrequency = (typeof ALERT_FREQUENCIES)[number]['id'] | 'off'

const regionNames = new Set(UK_AREAS.map((area) => area.region))

export function councilsFor(regions: string[]) {
  const selected = new Set(regions)
  return UK_AREAS.filter((area) => selected.has(area.region)).flatMap((area) => area.councils)
}

export function coverageChoice(id: string) {
  return COVERAGE_TIERS.find((tier) => tier.id === id)
}

/** Returns an error message when the ICP selection does not match the pricing tier. */
export function validateIcp(input: {
  coverage: string
  regions: string[]
  councils: string[]
  projectTypes: string[]
  valueRanges: string[]
  ribaStages: string[]
}) {
  const tier = coverageChoice(input.coverage)
  if (!tier) return 'Choose Regional, Multi County, or Nationwide'
  const regions = input.coverage === 'nationwide' ? UK_AREAS.map((area) => area.region) : [...new Set(input.regions)]
  if (regions.some((region) => !regionNames.has(region))) return 'Choose a region from the list'
  if (regions.length < tier.minRegions || regions.length > tier.maxRegions) {
    if (tier.id === 'regional') return 'Regional coverage includes one region'
    if (tier.id === 'multi_county') return 'Multi County coverage includes two or three regions'
    return 'Nationwide coverage includes every UK region'
  }
  const allowedCouncils = new Set(councilsFor(regions))
  const councils = [...new Set(input.councils)]
  if (councils.length > tier.maxCouncils) return `This tier includes up to ${tier.maxCouncils} councils`
  if (councils.some((council) => !allowedCouncils.has(council))) return 'Councils must sit inside the regions you selected'
  const projects = new Set<string>(PROJECT_TYPES)
  const values = new Set<string>(VALUE_RANGES)
  const stages = new Set<string>(RIBA_STAGES.map((stage) => stage.id))
  if (!input.projectTypes.length || input.projectTypes.some((item) => !projects.has(item))) return 'Choose at least one project type'
  if (!input.valueRanges.length || input.valueRanges.some((item) => !values.has(item))) return 'Choose at least one value range'
  if (!input.ribaStages.length || input.ribaStages.some((item) => !stages.has(item))) return 'Choose at least one RIBA stage from 0 to 2'
  return null
}

export function alertDue(frequency: string, lastSent: Date | null, now = new Date()) {
  if (frequency === 'off') return false
  if (frequency === 'immediate' || !lastSent) return true
  const elapsed = now.getTime() - lastSent.getTime()
  if (frequency === 'daily') return elapsed >= 20 * 60 * 60 * 1000
  if (frequency === 'weekly') return elapsed >= 6 * 24 * 60 * 60 * 1000
  return false
}
