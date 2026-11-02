import { blank } from './clean.ts'
import type { PlanItRecord } from './types.ts'

const AGENT_PHONE_KEYS = [
  'agent_tel',
  'agent_phone',
  'agent_telephone',
  'agent_mobile',
  'agent_contact_phone',
  'agent_contact_tel',
  'agent_number',
  'architect_phone',
  'architect_tel',
  'contact_phone',
  'contact_tel',
  'telephone',
  'tel',
  'phone',
  'mobile',
  'phone_number',
  'contact_number',
]

const AGENT_EMAIL_KEYS = [
  'agent_email',
  'agent_mail',
  'agent_e_mail',
  'architect_email',
  'contact_email',
  'email',
  'e_mail',
  'email_address',
]

const AGENT_NAME_KEYS = [
  'agent_name',
  'agent_contact',
  'agent_person',
  'architect_name',
  'contact_name',
  'agent',
]

const AGENT_COMPANY_KEYS = [
  'agent_company',
  'agent_firm',
  'agent_organisation',
  'agent_organization',
  'architect_company',
  'architect_firm',
  'company_name',
  'practice_name',
  'architect',
]

const AGENT_ADDRESS_KEYS = [
  'agent_address',
  'architect_address',
  'agent_location',
]

const APPLICANT_CONTACT_KEYS = [
  'applicant_contact',
  'client_contact',
]

const APPLICANT_NAME_KEYS = [
  'applicant_name',
  'applicant_company',
  'client_name',
  'applicant',
]

const APPLICANT_PHONE_KEYS = [
  'applicant_tel',
  'applicant_phone',
  'applicant_telephone',
  'applicant_mobile',
  'client_phone',
  'client_tel',
]

const APPLICANT_EMAIL_KEYS = [
  'applicant_email',
  'client_email',
]

const APPLICANT_ADDRESS_KEYS = [
  'applicant_address',
  'client_address',
]

const OFFICER_KEYS = [
  'case_officer',
  'officer',
  'officer_name',
  'planning_officer',
  'case_officer_name',
]

const BUSINESS_SUFFIX_RE = /\b(ltd|limited|llp|plc|inc|architects?|architecture|planning|planners|associates?|studio|design|consultants?|consultancy|consulting|group|services|partners|partnership|developments?|properties|property|homes|building|builders|surveyors|surveying|engineers|engineering|tree|trees|care|council|authority|borough|trust|housing|estates?)\b/i

const PERSON_TITLE_RE = /^(mr|mrs|miss|ms|mx|dr|prof|sir|lady|lord|rev)\b\.?\s+/i

const ATTN_PREFIX_RE = /^(?:attn\.?|attention:?|f\.?a\.?o\.?:?|per|c\/o)\s+((?:(?:mr|mrs|miss|ms|dr|prof)\.?\s+)?[A-Z][a-zA-Z'-]+\s+[A-Z][a-zA-Z'-]+)\s+/i

/**
 * Normalizes and validates a candidate UK telephone number.
 * Returns empty string if the input is not a valid 10- or 11-digit UK number.
 */
export function formatUkPhone(raw: string): string {
  if (!raw) return ''
  const cleaned = raw
    .replace(/(?:ext\.?|extension|x|opt(?:ion)?)\s*\d+$/i, '')
    .trim()
  let digits = cleaned
    .replace(/^\+?44\s*\(0\)\s*/, '0')
    .replace(/^\+?44\s*/, '0')
    .replace(/^0044\s*\(0\)\s*/, '0')
    .replace(/^0044\s*/, '0')
    .replace(/\D+/g, '')

  if (digits.length === 10 && /^[12378]/.test(digits)) {
    digits = `0${digits}`
  }
  if (!/^0[12378]\d{8,9}$/.test(digits)) return ''
  if (/^0[237]/.test(digits) && digits.length !== 11) return ''
  if (/^0(\d)\1{8,9}$/.test(digits)) return ''
  if (digits === '01234567890' || digits === '0123456789') return ''

  if (digits.startsWith('07')) {
    return `${digits.slice(0, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
  }
  if (digits.startsWith('02')) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`
  }
  if (digits.startsWith('03') || digits.startsWith('08')) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  }
  if (/^01(?:1\d|\d1)/.test(digits) && digits.length === 11) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  }
  return `${digits.slice(0, 5)} ${digits.slice(5)}`
}

/**
 * Extracts all valid UK phone numbers from free text while avoiding dates, coordinates, and planning refs.
 */
export function extractUkPhones(text: string): string[] {
  if (!text) return []
  const results = new Set<string>()
  const pattern = /(?:\+44\s*\(?0?\)?\s*|0044\s*\(?0?\)?\s*|\(?0)(?:7\d{3}|2\d|3\d{2}|8\d{2}|1\d{2,4})\)?[\s.-]?\d{3,4}[\s.-]?\d{2,4}\b/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    const start = match.index
    const prev = start > 0 ? text[start - 1] : ''
    if (prev && /[0-9A-Za-z./-]/.test(prev)) continue
    const formatted = formatUkPhone(match[0])
    if (formatted) results.add(formatted)
  }
  return [...results]
}

/**
 * Extracts valid business/contact email addresses from free text.
 */
export function extractEmails(text: string): string[] {
  if (!text) return []
  const results = new Set<string>()
  const pattern = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,12}\b/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    const email = match[0].toLowerCase().replace(/[.,;:]+$/, '')
    if (/\.(png|jpg|jpeg|gif|svg|webp|pdf|css|js)$/i.test(email)) continue
    if (/^(noreply|no-reply|donotreply|do-not-reply)@/i.test(email)) continue
    if (email.endsWith('@example.com') || email.endsWith('@example.test')) continue
    results.add(email)
  }
  return [...results]
}

function firstField(extra: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const val = blank(extra[key])
    if (val) return val
  }
  const lowerMap = new Map<string, unknown>()
  for (const [k, v] of Object.entries(extra)) {
    lowerMap.set(k.toLowerCase(), v)
  }
  for (const key of keys) {
    const val = blank(lowerMap.get(key.toLowerCase()))
    if (val) return val
  }
  return ''
}

function extractLeadingCompanyFromAddress(address: string): string {
  if (!address) return ''
  // Match a leading company name before a house/building number, e.g. "Stickland Wright Ltd 23 Vine Street..."
  const beforeNumber = /^([A-Za-z][A-Za-z0-9&'.,\-\s]{2,55}?)\s+\d{1,4}[A-Za-z]?\s+[A-Z]/
  const match = beforeNumber.exec(address.trim())
  if (match?.[1] && BUSINESS_SUFFIX_RE.test(match[1])) {
    return match[1].replace(/[,\s]+$/, '').trim()
  }
  // Or a leading phrase with a clear business suffix like "Devon Tree Services Little Acre..."
  const suffixMatch = /^([A-Z][A-Za-z0-9&'.\-\s]{1,40}?\b(?:Ltd|Limited|LLP|PLC|Architects|Architecture|Planning|Associates|Studio|Consultancy|Consultants|Services|Partners|Surveyors|Design|Group))\b/i.exec(address.trim())
  if (suffixMatch?.[1]) {
    return suffixMatch[1].replace(/[,\s]+$/, '').trim()
  }
  return ''
}

function isLikelyPersonName(value: string): boolean {
  if (!value) return false
  if (PERSON_TITLE_RE.test(value)) return true
  if (BUSINESS_SUFFIX_RE.test(value)) return false
  const words = value.trim().split(/\s+/)
  return words.length >= 2 && words.length <= 3 && words.every((w) => /^[A-Z][a-z'-]+$/.test(w))
}

export type ExtractedRecordContacts = {
  applicantContact: string
  applicant: string
  applicantAddress: string
  applicantPhone: string
  applicantEmail: string
  agentName: string
  agentCompany: string
  agentAddress: string
  agentPhone: string
  agentEmail: string
  caseOfficer: string
}

export function extractRecordContacts(record: PlanItRecord): ExtractedRecordContacts {
  const extra = record.other_fields && typeof record.other_fields === 'object' ? record.other_fields : {}

  let applicantContact = firstField(extra, APPLICANT_CONTACT_KEYS)
  const applicant = firstField(extra, APPLICANT_NAME_KEYS)
  let applicantAddress = firstField(extra, APPLICANT_ADDRESS_KEYS)
  let applicantPhone = formatUkPhone(firstField(extra, APPLICANT_PHONE_KEYS))
  let applicantEmail = extractEmails(firstField(extra, APPLICANT_EMAIL_KEYS))[0] ?? ''

  let agentName = firstField(extra, AGENT_NAME_KEYS)
  let agentCompany = firstField(extra, AGENT_COMPANY_KEYS)
  let agentAddress = firstField(extra, AGENT_ADDRESS_KEYS)
  let agentPhone = formatUkPhone(firstField(extra, AGENT_PHONE_KEYS))
  let agentEmail = extractEmails(firstField(extra, AGENT_EMAIL_KEYS))[0] ?? ''
  const caseOfficer = firstField(extra, OFFICER_KEYS)

  // Check for "Attn. Mr Toby Smith" / "Per Alex Mitchell" / "c/o ..." in agentAddress
  if (agentAddress) {
    const attnMatch = ATTN_PREFIX_RE.exec(agentAddress)
    if (attnMatch?.[1]) {
      if (!agentName) agentName = attnMatch[1].trim()
      agentAddress = agentAddress.slice(attnMatch[0].length).trim()
    }
  }

  if (applicantAddress) {
    const attnMatch = ATTN_PREFIX_RE.exec(applicantAddress)
    if (attnMatch?.[1]) {
      if (!applicantContact) applicantContact = attnMatch[1].trim()
      applicantAddress = applicantAddress.slice(attnMatch[0].length).trim()
    }
  }

  // If agentCompany is blank, check if agentAddress starts with a company name
  if (!agentCompany && agentAddress) {
    const leadingFirm = extractLeadingCompanyFromAddress(agentAddress)
    if (leadingFirm) agentCompany = leadingFirm
  }

  // If agentName is blank but agentCompany is a person's name (e.g. "Mr Alasdair Jeffrey"), use it as agentName too
  if (!agentName && agentCompany && isLikelyPersonName(agentCompany)) {
    agentName = agentCompany
  }

  // If agentCompany is blank and agentName is present, mirror agentName
  if (!agentCompany && agentName) {
    agentCompany = agentName
  }

  // If agentName is blank and agentCompany is present, use agentCompany as contact fallback
  if (!agentName && agentCompany) {
    agentName = agentCompany
  }

  if (!applicantContact && applicant && isLikelyPersonName(applicant)) {
    applicantContact = applicant
  }

  // Scan agent-related strings for embedded phone numbers and emails
  if (!agentPhone || !agentEmail) {
    const agentTextParts = [
      agentName,
      agentCompany,
      agentAddress,
      ...Object.entries(extra)
        .filter(([k]) => /agent|architect|contact|tel|phone|mobile|email|mail/i.test(k) && !/applicant|client/i.test(k))
        .map(([, v]) => blank(v)),
    ].filter(Boolean)
    const combinedAgentText = agentTextParts.join(' | ')
    if (!agentPhone) {
      agentPhone = extractUkPhones(combinedAgentText)[0] ?? ''
    }
    if (!agentEmail) {
      agentEmail = extractEmails(combinedAgentText)[0] ?? ''
    }
  }

  // Scan applicant-related strings for embedded phone numbers and emails
  if (!applicantPhone || !applicantEmail) {
    const applicantTextParts = [
      applicantContact,
      applicant,
      applicantAddress,
      ...Object.entries(extra)
        .filter(([k]) => /applicant|client/i.test(k))
        .map(([, v]) => blank(v)),
    ].filter(Boolean)
    const combinedApplicantText = applicantTextParts.join(' | ')
    if (!applicantPhone) {
      applicantPhone = extractUkPhones(combinedApplicantText)[0] ?? ''
    }
    if (!applicantEmail) {
      applicantEmail = extractEmails(combinedApplicantText)[0] ?? ''
    }
  }

  // Final scan across description if phone/email were embedded in the proposal text
  const description = blank(record.description)
  if (!agentPhone && description) {
    const descPhone = extractUkPhones(description)[0]
    if (descPhone) agentPhone = descPhone
  }
  if (!agentEmail && description) {
    const descEmail = extractEmails(description)[0]
    if (descEmail) agentEmail = descEmail
  }

  return {
    applicantContact,
    applicant,
    applicantAddress,
    applicantPhone,
    applicantEmail,
    agentName,
    agentCompany,
    agentAddress,
    agentPhone,
    agentEmail,
    caseOfficer,
  }
}
