import { lpaAreas } from './lpas'

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
    maxCouncils: 80,
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
    maxCouncils: 200,
  },
  {
    id: 'nationwide',
    label: 'Nationwide',
    detail: 'All active UK local planning authorities.',
    planName: 'All UK Nationwide',
    monthlyPrice: '£299',
    tier: 'NATIONWIDE',
    minRegions: 12,
    maxRegions: 12,
    maxCouncils: 400,
  },
] as const

export type CoverageId = (typeof COVERAGE_TIERS)[number]['id']

/** Active local planning authorities grouped into the 12 coverage regions. */
export const UK_AREAS: { region: string; councils: string[] }[] = lpaAreas()

export const PROJECT_TYPES = ['Residential', 'Commercial', 'Mixed use', 'Industrial', 'Education', 'Healthcare', 'Infrastructure', 'Heritage'] as const
export const VALUE_RANGES = ['£100k–£250k', '£250k–£1m', '£1m–£5m', '£5m+'] as const
export const RIBA_STAGES = [
  { id: '0', label: 'Stage 0', detail: 'Strategic definition' },
  { id: '1', label: 'Stage 1', detail: 'Preparation and briefing' },
  { id: '2', label: 'Stage 2', detail: 'Concept design' },
] as const

/** Recent-application windows. Add 14 or 30 here when the product needs them. */
export const LEAD_WINDOWS = [
  { days: 3, label: 'Last 3 days' },
  { days: 7, label: 'Last 7 days' },
] as const

export type LeadWindowDays = (typeof LEAD_WINDOWS)[number]['days']

export function icpCouncils(input: { coverage: string; regions: string[]; councils: string[] }) {
  const regions = input.coverage === 'nationwide' ? UK_AREAS.map((area) => area.region) : input.regions
  const allowed = councilsFor(regions)
  const pool = input.councils.length ? input.councils.filter((council) => allowed.includes(council)) : allowed
  return [...new Set(pool)]
}

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
