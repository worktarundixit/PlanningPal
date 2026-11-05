export {
  ALERT_FREQUENCIES,
  COVERAGE_TIERS,
  ONBOARDING_STEPS,
  PROJECT_TYPES,
  RIBA_STAGES,
  LEAD_WINDOWS,
  UK_AREAS,
  VALUE_RANGES,
  alertDue,
  councilsFor,
  coverageChoice,
  icpCouncils,
  validateIcp,
} from './onboarding'
export type { AlertFrequency, CoverageId, LeadWindowDays, OnboardingStep } from './onboarding'
export {
  LPA_RECORDS,
  LPA_REGIONS,
  feedHealth,
  lpaAreas,
  lpaByGss,
  planItIngestAreas,
} from './lpas'
export type { LpaCoverage, LpaRecord, LpaStatus } from './lpas'

export const MASTER_COLUMNS = [
  'Heading',
  '£m Value From',
  '£m Value To',
  'Proposal',
  'Site Raw Address',
  'Client Applicant Contact',
  'Client Applicant',
  'Client Applicant Raw Address',
  'Client Applicant Phone',
  'Architect Agent Contact',
  'Architect Agent',
  'Architect Agent Raw Address',
  'Architect Agent Phone',
  'Architect Agent Email',
  'Mail Client Contact',
  'Mail Client Name',
  'Client Applicant Address Line 1',
  'Client Applicant Address Line 2',
  'Client Applicant Address Line 3',
  'Client Applicant Address Line 4',
  'Client Applicant Postcode',
  'Client Applicant Postcode Area',
  'Mail Architect Agent Contact',
  'Mail Architect Agent Name',
  'Architect Agent Address Line 1',
  'Architect Agent Address Line 2',
  'Architect Agent Address Line 3',
  'Architect Agent Address Line 4',
  'Architect Agent Postcode',
  'Architect Agent Postcode Area',
  'Site Address',
  'Site Address Postcode Area',
  'Prop Type',
  '£m Est Prop Val From',
  '£m Est Prop Val To',
  'URL Link',
  'Local Authority',
  'Application Reference',
  'County',
  'Region',
  'Project Stage',
  'Publication Date',
  'Project ID',
  'Project Category',
] as const

export type MasterColumn = (typeof MASTER_COLUMNS)[number]
export type SourceRecord = Record<string, string>

export const CRM_STAGES = [
  { index: 0, id: 'STAGE_1_COLD', label: 'New lead queue' },
  { index: 1, id: 'STAGE_2_OUTREACH', label: 'Active outreach' },
  { index: 2, id: 'STAGE_3_INTENT', label: 'High intent' },
  { index: 3, id: 'STAGE_4_WARM', label: 'Warm engagement' },
  { index: 4, id: 'STAGE_5_TENDER', label: 'Tender opportunity' },
] as const

export type CrmStageId = (typeof CRM_STAGES)[number]['id']

export function stageById(id: string) {
  return CRM_STAGES.find((stage) => stage.id === id)
}

export function stageByIndex(index: number) {
  return CRM_STAGES.find((stage) => stage.index === index)
}

export type Scheme = {
  id: string
  title: string
  location: string
  type: string
  stage: string
  value: string
  valueNum: number
  valueFrom?: number
  estimated?: boolean
  distance: string
  date: string
  council: string
  units: string
  score: number
  status: string
  initials: string
  colour: string
  description: string
  architect: string
  practice: string
  email: string
  phone: string
  applicant?: string
  applicantAddress?: string
  architectAddress?: string
  postcode?: string
  county?: string
  region?: string
  projectStage?: string
  projectId?: string
  category?: string
  portalUrl?: string
  ward?: string
  caseOfficer?: string
  applicationType?: string
  decisionDate?: string
  raw: SourceRecord
}

/**
 * Public contact details.
 * TODO: confirm the real PlanningPal inbox. hello@planningpal.co.uk is a placeholder.
 */
export const PUBLIC_EMAIL = 'hello@planningpal.co.uk'

/** Shown as printed until a replacement number is confirmed. */
export const PUBLIC_PHONE_DISPLAY = '+44 07774 720591'

export const PUBLIC_PHONE_TEL = '+4407774720591'

export type EmailPreferences = {
  highIntent?: boolean
  taskReminders?: boolean
  weeklyDigest?: boolean
}

export type PortalDocument = {
  title: string
  kind: 'application_form' | 'design_access_statement' | 'drawing_plan' | 'decision_notice' | 'other'
  category?: 'Application Form' | 'Statement' | 'Drawing / Plan' | 'Decision / Notice' | 'Supporting Document'
  url: string
  publishedOn?: string
  date?: string
}

export type UserProfile = {
  name: string
  firstName?: string
  lastName?: string
  role: string
  company: string
  email: string
  phone?: string
  secondaryEmail?: string
  twoFactorEnabled?: boolean
  alertsEnabled?: boolean
  alertFrequency?: string
  emailPreferences?: EmailPreferences
}

const COLOURS = ['bg-[#7DD3FC]', 'bg-[#C4B5FD]', 'bg-[#F9A8D4]', 'bg-[#FCD34D]', 'bg-[#86EFAC]']

export function parseCsv(text: string): SourceRecord[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (character === '"') quoted = false
      else field += character
    } else if (character === '"') quoted = true
    else if (character === ',') {
      row.push(field)
      field = ''
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''))
      rows.push(row)
      row = []
      field = ''
    } else field += character
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ''))
    rows.push(row)
  }
  const headers = rows.shift()?.map((header) => header.replace(/^\uFEFF/, '')) ?? []
  return rows
    .filter((values) => values.some(Boolean))
    .map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])))
}

/** Stop spreadsheet apps from treating a cell as a formula. */
export function csvCell(value: unknown) {
  const text = String(value ?? '')
  const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
  return `"${guarded.replaceAll('"', '""')}"`
}

export function toCsv(records: SourceRecord[]): string {
  const fields = MASTER_COLUMNS.filter((column) => records.some((record) => column in record))
  const header = fields.length ? fields : [...MASTER_COLUMNS]
  const rows = [header, ...records.map((record) => header.map((field) => record[field] ?? ''))]
  return rows.map((line) => line.map((value) => csvCell(value)).join(',')).join('\n')
}

export function mapRecord(record: SourceRecord, index: number): Scheme {
  const rawFrom = record['£m Value From'] || record['£m Est Prop Val From'] || ''
  const rawTo = record['£m Value To'] || record['£m Est Prop Val To'] || ''
  const valueFrom = Number(rawFrom || 0)
  const valueTo = Number(rawTo || rawFrom || 0)

  let valueLabel = ''
  let estimated = false
  if (valueTo > 0) {
    valueLabel = valueFrom > 0 ? `£${valueFrom.toFixed(2)}m–£${valueTo.toFixed(2)}m` : `£${valueTo.toFixed(2)}m`
  } else {
    // Keyword & proposal size fallback (Issue 1)
    const text = (record.Proposal || record.Heading || '').toLowerCase()
    if (/hotel|supermarket|mixed-use|hospital|tower|student accommodation|data centre/.test(text)) {
      valueLabel = '£4.00m–£12.00m (est)'
      estimated = true
    } else if (/\b(?:major development|substantial redevelopment|multi-storey)\b/.test(text)) {
      valueLabel = '£2.50m–£6.00m (est)'
      estimated = true
    } else if (/\b(?:erection of|demolition and erection|new building)\b/.test(text)) {
      valueLabel = '£0.75m–£2.00m (est)'
      estimated = true
    } else if (/\b(?:extension|alteration|refurbishment|conversion|loft)\b/.test(text)) {
      valueLabel = '£0.12m–£0.35m (est)'
      estimated = true
    } else {
      valueLabel = 'Not estimated'
      estimated = false
    }
  }

  const agent = record['Architect Agent Contact'] || record['Mail Architect Agent Contact'] || 'Contact not published'
  const practice = record['Architect Agent'] || record['Mail Architect Agent Name'] || 'Agent not published'

  // Title cleaning: fall back if empty, numeric only, or too short (Issue 11)
  let heading = (record.Heading || '').trim()
  const ref = record['Application Reference'] || record['Project ID'] || `record-${index}`
  if (!heading || heading.length < 8 || /^\d+$/.test(heading)) {
    const proposal = (record.Proposal || '').trim()
    if (proposal && proposal.length >= 8) {
      heading = proposal.length > 110 ? `${proposal.slice(0, 107).trim()}…` : proposal
    } else {
      heading = ref ? `Application ${ref}` : (record['Prop Type'] || 'Planning application')
    }
  }

  const projectCategory = (record['Project Category'] || 'Planning').replaceAll('_', ' ')
  const initials = heading
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  return {
    id: ref,
    title: heading,
    location: record['Site Address'] || record['Site Raw Address'] || '',
    type: `${record['Prop Type'] || 'Scheme'} · ${projectCategory}`,
    stage: record['Project Stage']?.includes('APPROVED') ? 'Approved' : record['Project Stage'] || 'Planning',
    value: valueLabel,
    valueNum: valueTo || (estimated ? 0.75 : 0),
    valueFrom,
    estimated,
    distance: record['Site Address Postcode Area'] || record.County || '',
    date: record['Publication Date'] || '',
    council: record['Local Authority'] || '',
    units: record['Prop Type'] || record['Project Category'] || 'General scheme',
    score: Math.max(
      64,
      Math.min(
        98,
        70 +
          (record['Architect Agent Email'] ? 10 : 0) +
          (record['Architect Agent Phone'] ? 8 : 0) +
          (valueTo >= 1 ? 6 : 0) +
          (index % 5),
      ),
    ),
    status: record['Architect Agent Email'] && record['Architect Agent Phone'] ? 'High fit' : 'Good fit',
    initials: initials || 'PA',
    colour: COLOURS[index % COLOURS.length] ?? 'bg-[#7DD3FC]',
    description: record.Proposal || '',
    architect: agent,
    practice,
    email: record['Architect Agent Email'] || '',
    phone: record['Architect Agent Phone'] || '',
    applicant: record['Client Applicant'] || record['Mail Client Name'] || '',
    applicantAddress: record['Client Applicant Raw Address'] || record['Client Applicant Address Line 1'] || '',
    architectAddress: record['Architect Agent Raw Address'] || record['Architect Agent Address Line 1'] || '',
    postcode: record['Site Address Postcode Area'] || '',
    county: record.County,
    region: record.Region,
    projectStage: record['Project Stage'],
    projectId: record['Project ID'],
    category: projectCategory,
    portalUrl: record['URL Link'],
    ward: record.Ward || record.ward || '',
    caseOfficer: record['Case Officer'] || record.caseOfficer || '',
    applicationType: record['Application Type'] || record.applicationType || '',
    decisionDate: record['Decision Date'] || record.decisionDate || '',
    raw: record,
  }
}

export function contactLevel(scheme: Pick<Scheme, 'email' | 'phone'>): 'Direct' | 'Partial' | 'Missing' {
  if (scheme.email && scheme.phone) return 'Direct'
  if (scheme.email || scheme.phone) return 'Partial'
  return 'Missing'
}

export function councilCode(name: string) {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 32)
}

export const DEMO_PROFILE: UserProfile = {
  name: 'James Wilkins',
  role: 'Account owner',
  company: 'Micraft Design Ltd',
  email: 'tarun@design.com',
  twoFactorEnabled: false,
}
