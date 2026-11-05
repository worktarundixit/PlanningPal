import { MASTER_COLUMNS, type SourceRecord } from '@planningpal/shared'
import { addressLines, applicationReference, blank, formatPublicationDate, splitPostcode } from './clean.ts'
import { extractRecordContacts } from './contacts.ts'
import { lookupAuthority } from './gazetteer.ts'
import type { CleanedRecord, PlanItRecord } from './types.ts'
import { classifyScheme, estimateValue } from './value.ts'

function field(record: PlanItRecord, key: string) {
  const extra = record.other_fields
  if (!extra || typeof extra !== 'object') return ''
  return blank(extra[key])
}

function stage(state: string) {
  const value = state.trim()
  if (!value) return ''
  if (/permit|grant|approv/i.test(value)) return 'Permitted'
  if (/refus|reject/i.test(value)) return 'Refused'
  if (/withdraw/i.test(value)) return 'Withdrawn'
  return value
}

function heading(description: string, reference: string) {
  const text = description.replace(/\s+/g, ' ').trim()
  if (!text) return reference
  const cut = text.split(/[.;]/)[0] ?? text
  return cut.length > 120 ? `${cut.slice(0, 117).trim()}…` : cut
}

export function mapPlanItRecord(record: PlanItRecord): CleanedRecord | null {
  const area = blank(record.area_name)
  const reference = applicationReference(record)
  if (!area || !reference) return null
  const authority = lookupAuthority(area)
  const rawAddress = blank(record.address)
  const located = splitPostcode(rawAddress, blank(record.postcode))
  const description = blank(record.description)
  const classified = classifyScheme(`${description} ${blank(record.app_type)}`, blank(record.app_size))
  const value = estimateValue(description, classified.category, classified.units, classified.floorspace, blank(record.app_size))
  const extracted = extractRecordContacts(record)
  const applicant = extracted.applicant
  const applicantContact = extracted.applicantContact
  const applicantAddress = extracted.applicantAddress
  const applicantPhone = extracted.applicantPhone
  const agentName = extracted.agentName
  const agentCompany = extracted.agentCompany || agentName
  const agentAddress = extracted.agentAddress
  const agentPhone = extracted.agentPhone
  const agentEmail = extracted.agentEmail
  const agentLocated = splitPostcode(agentAddress)
  const applicantLocated = splitPostcode(applicantAddress)
  const applicantLines = addressLines(applicantAddress, applicantLocated.postcode)
  const agentLines = addressLines(agentAddress, agentLocated.postcode)
  const published = formatPublicationDate(blank(record.start_date) || field(record, 'date_validated'))
  const columns: SourceRecord = {
    Heading: heading(description, reference),
    '£m Value From': value?.from ?? '',
    '£m Value To': value?.to ?? '',
    Proposal: description,
    'Site Raw Address': rawAddress,
    'Client Applicant Contact': applicantContact,
    'Client Applicant': applicant,
    'Client Applicant Raw Address': applicantAddress,
    'Client Applicant Phone': applicantPhone,
    'Architect Agent Contact': agentName,
    'Architect Agent': agentCompany,
    'Architect Agent Raw Address': agentAddress,
    'Architect Agent Phone': agentPhone,
    'Architect Agent Email': agentEmail,
    'Mail Client Contact': applicantContact,
    'Mail Client Name': applicant,
    'Client Applicant Address Line 1': applicantLines.line1,
    'Client Applicant Address Line 2': applicantLines.line2,
    'Client Applicant Address Line 3': applicantLines.line3,
    'Client Applicant Address Line 4': applicantLines.line4,
    'Client Applicant Postcode': applicantLocated.postcode,
    'Client Applicant Postcode Area': applicantLocated.area,
    'Mail Architect Agent Contact': agentName,
    'Mail Architect Agent Name': agentCompany,
    'Architect Agent Address Line 1': agentLines.line1,
    'Architect Agent Address Line 2': agentLines.line2,
    'Architect Agent Address Line 3': agentLines.line3,
    'Architect Agent Address Line 4': agentLines.line4,
    'Architect Agent Postcode': agentLocated.postcode,
    'Architect Agent Postcode Area': agentLocated.area,
    'Site Address': rawAddress,
    'Site Address Postcode Area': located.area,
    'Prop Type': classified.propType,
    '£m Est Prop Val From': value?.from ?? '',
    '£m Est Prop Val To': value?.to ?? '',
    'URL Link': blank(record.url) || blank(record.link),
    'Local Authority': authority.name,
    'Application Reference': reference,
    County: authority.county,
    Region: authority.region,
    'Project Stage': stage(blank(record.app_state)),
    'Publication Date': published,
    'Project ID': blank(record.name) || reference,
    'Project Category': classified.category,
    Ward: field(record, 'ward') || blank((record as Record<string, unknown>).ward),
    'Case Officer': field(record, 'case_officer') || field(record, 'officer') || blank((record as Record<string, unknown>).case_officer),
    'Application Type': blank(record.app_type) || field(record, 'app_type') || field(record, 'application_type'),
    'Decision Date': blank(record.decided_date) || field(record, 'decision_date') || field(record, 'decided_date'),
  }
  for (const column of MASTER_COLUMNS) columns[column] ??= ''
  const longitude = typeof record.location_x === 'number' ? record.location_x : null
  const latitude = typeof record.location_y === 'number' ? record.location_y : null
  return {
    authorityKey: area,
    reference,
    columns,
    longitude,
    latitude,
    lastDifferent: blank(record.last_different),
  }
}
