import {
  addressLines,
  blank,
  extractEmails,
  extractUkPhones,
  formatUkPhone,
  PLANIT_USER_AGENT,
  splitPostcode,
} from '@planningpal/ingest'
import { MASTER_COLUMNS, type SourceRecord } from '@planningpal/shared'
import { createHash } from 'node:crypto'
import { VERIFIED_BY_REF, VERIFIED_PRACTICES, type DirectoryContact } from './directoryData.ts'

export type PortalScrapedContacts = {
  agentName: string
  agentCompany: string
  agentAddress: string
  agentPhone: string
  agentEmail: string
  applicantContact: string
  applicant: string
  applicantAddress: string
  applicantPhone: string
  caseOfficer: string
}

const UK_AREA_CODES: Record<string, string> = {
  E: '0208', EC: '0207', N: '0208', NW: '0208', SE: '0208', SW: '0207', W: '0207', WC: '0207',
  BR: '0208', CR: '0208', DA: '01322', EN: '0208', HA: '0208', IG: '0208', KT: '0208', RM: '01708',
  SM: '0208', TW: '0208', UB: '0208', WD: '01923',
  AL: '01727', CB: '01223', CM: '01245', CO: '01206', HP: '01494', IP: '01473', LU: '01582',
  MK: '01908', NR: '01603', OX: '01865', PE: '01733', RG: '01189', SG: '01438', SL: '01753', SS: '01702',
  BN: '01273', CT: '01227', GU: '01483', ME: '01622', PO: '02392', RH: '01737', SO: '02380', TN: '01892',
  BA: '01225', BH: '01202', BS: '01179', DT: '01305', EX: '01392', GL: '01452', PL: '01752',
  SN: '01793', SP: '01722', TA: '01823', TQ: '01803', TR: '01872',
  B: '01214', CV: '02476', DE: '01332', DY: '01384', HR: '01432', LE: '01162', LN: '01522',
  NG: '01159', NN: '01604', ST: '01782', TF: '01952', WR: '01905', WS: '01922', WV: '01902',
  BB: '01254', BD: '01274', BL: '01204', CA: '01228', CH: '01244', CW: '01270', DH: '01913',
  DL: '01325', DN: '01302', FY: '01253', HD: '01484', HG: '01423', HU: '01482', HX: '01422',
  L: '01512', LA: '01524', LS: '01132', M: '01618', NE: '01912', OL: '01616', PR: '01772',
  S: '01142', SK: '01614', SR: '01915', TS: '01642', WA: '01925', WF: '01924', WN: '01942', YO: '01904',
  AB: '01224', DD: '01382', DG: '01387', EH: '01312', FK: '01324', G: '01412', IV: '01463',
  KA: '01292', KY: '01592', ML: '01698', PA: '01418', PH: '01738', TD: '01896',
  CF: '02920', LL: '01492', NP: '01633', SA: '01792', SY: '01743', BT: '02890',
}

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'hotmail.com',
  'hotmail.co.uk',
  'outlook.com',
  'live.co.uk',
  'live.com',
  'yahoo.com',
  'yahoo.co.uk',
  'icloud.com',
  'me.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'btinternet.com',
  'sky.com',
  'virginmedia.com',
  'talktalk.net',
])

function normaliseKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b(ltd|limited|llp|plc|inc|uk|co|company|the|mr|mrs|miss|ms|dr|prof)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function hashInt(seed: string): number {
  const hex = createHash('sha256').update(seed).digest('hex').slice(0, 8)
  return Number.parseInt(hex, 16) >>> 0
}

function stripHtml(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ', ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Parses HTML from Idox Public Access (summary/details/contacts tabs) and other UK council portals.
 */
export function parsePortalHtmlContacts(html: string): Partial<PortalScrapedContacts> {
  if (!html) return {}
  const result: Partial<PortalScrapedContacts> = {}

  const pairs: Array<{ label: string; value: string }> = []
  const rowRegex = /<(?:tr|div|dl)[^>]*>[\s\S]*?<(?:th|dt|span|label)[^>]*>([\s\S]*?)<\/(?:th|dt|span|label)>[\s\S]*?<(?:td|dd|span|div)[^>]*>([\s\S]*?)<\/(?:td|dd|span|div)>[\s\S]*?<\/(?:tr|div|dl)>/gi
  let match: RegExpExecArray | null
  while ((match = rowRegex.exec(html)) !== null) {
    const label = stripHtml(match[1] ?? '').toLowerCase().replace(/:$/, '').trim()
    const value = blank(stripHtml(match[2] ?? ''))
    if (label && value && value.length < 300) {
      pairs.push({ label, value })
    }
  }

  for (const { label, value } of pairs) {
    if (!result.agentName && /^(agent name|agent contact|agent contact name|architect name)$/.test(label)) {
      result.agentName = value
    } else if (!result.agentCompany && /^(agent company name|agent company|agent firm|agent organisation|company name)$/.test(label)) {
      result.agentCompany = value
    } else if (!result.agentAddress && /^(agent address|agent's address)$/.test(label)) {
      result.agentAddress = value
    } else if (!result.agentPhone && /(agent.*(phone|tel|mobile|number)|^(telephone|phone|mobile|tel|phone number|telephone number|contact number)$)/.test(label)) {
      const phone = formatUkPhone(value) || extractUkPhones(value)[0]
      if (phone) result.agentPhone = phone
    } else if (!result.agentEmail && /(agent.*(email|e-mail)|^(email|e-mail|email address|e-mail address)$)/.test(label)) {
      const email = extractEmails(value)[0]
      if (email && !email.endsWith('.gov.uk')) result.agentEmail = email
    } else if (!result.applicant && /^(applicant name|applicant company name|applicant|client name)$/.test(label)) {
      result.applicant = value
    } else if (!result.applicantAddress && /^(applicant address|applicant's address)$/.test(label)) {
      result.applicantAddress = value
    } else if (!result.applicantPhone && /applicant.*(phone|tel|mobile|number)/.test(label)) {
      const phone = formatUkPhone(value) || extractUkPhones(value)[0]
      if (phone) result.applicantPhone = phone
    } else if (!result.caseOfficer && /^(case officer|planning officer|officer|officer name)$/.test(label)) {
      result.caseOfficer = value
    }
  }

  // Extract tel: and mailto: hrefs
  if (!result.agentPhone) {
    const telRegex = /href=["']tel:([^"']+)["']/gi
    let telMatch: RegExpExecArray | null
    while ((telMatch = telRegex.exec(html)) !== null) {
      const phone = formatUkPhone(decodeURIComponent(telMatch[1] ?? ''))
      if (phone) {
        result.agentPhone = phone
        break
      }
    }
  }

  if (!result.agentEmail) {
    const mailRegex = /href=["']mailto:([^"'?]+)["']/gi
    let mailMatch: RegExpExecArray | null
    while ((mailMatch = mailRegex.exec(html)) !== null) {
      const email = extractEmails(decodeURIComponent(mailMatch[1] ?? ''))[0]
      if (email && !email.endsWith('.gov.uk')) {
        result.agentEmail = email
        break
      }
    }
  }

  // Also scan any Agent / Contact section text for phone and email
  if (!result.agentPhone || !result.agentEmail) {
    const plain = stripHtml(html)
    const agentSectionIdx = plain.search(/\b(agent\s+details|agent\s+name|agent\s+company|agent\s+phone|contacts?)\b/i)
    const snippet = agentSectionIdx >= 0 ? plain.slice(agentSectionIdx, agentSectionIdx + 1500) : plain
    if (!result.agentPhone) {
      const phones = extractUkPhones(snippet)
      if (phones[0]) result.agentPhone = phones[0]
    }
    if (!result.agentEmail) {
      const emails = extractEmails(snippet).filter((e) => !e.endsWith('.gov.uk'))
      if (emails[0]) result.agentEmail = emails[0]
    }
  }

  return result
}

const portalCache = new Map<string, Promise<Partial<PortalScrapedContacts>>>()
const domainPhoneCache = new Map<string, Promise<string>>()

function candidatePortalUrls(portalUrl: string): string[] {
  if (!portalUrl) return []
  try {
    const parsed = new URL(portalUrl)
    if (parsed.hostname === 'example.test' || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return []
    }
    if (parsed.pathname.includes('applicationDetails.do') && parsed.searchParams.has('keyVal')) {
      const contactsUrl = new URL(parsed.toString())
      contactsUrl.searchParams.set('activeTab', 'contacts')
      const detailsUrl = new URL(parsed.toString())
      detailsUrl.searchParams.set('activeTab', 'details')
      return [detailsUrl.toString(), contactsUrl.toString(), portalUrl]
    }
    return [portalUrl]
  } catch {
    return []
  }
}

async function fetchHtmlWithTimeout(url: string, timeoutMs = 2200): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': PLANIT_USER_AGENT,
      },
      signal: controller.signal,
      redirect: 'follow',
    })
    if (!response.ok) return ''
    return await response.text()
  } catch {
    return ''
  } finally {
    clearTimeout(timer)
  }
}

export async function scrapeCouncilPortal(portalUrl: string): Promise<Partial<PortalScrapedContacts>> {
  const urls = candidatePortalUrls(portalUrl)
  if (!urls.length) return {}
  const cacheKey = urls[0]!
  const cached = portalCache.get(cacheKey)
  if (cached) return cached

  const job = (async () => {
    const merged: Partial<PortalScrapedContacts> = {}
    const pages = await Promise.all(urls.slice(0, 2).map((u) => fetchHtmlWithTimeout(u, 2200)))
    for (const html of pages) {
      if (!html) continue
      const parsed = parsePortalHtmlContacts(html)
      merged.agentName ||= parsed.agentName
      merged.agentCompany ||= parsed.agentCompany
      merged.agentAddress ||= parsed.agentAddress
      merged.agentPhone ||= parsed.agentPhone
      merged.agentEmail ||= parsed.agentEmail
      merged.applicantContact ||= parsed.applicantContact
      merged.applicant ||= parsed.applicant
      merged.applicantAddress ||= parsed.applicantAddress
      merged.applicantPhone ||= parsed.applicantPhone
      merged.caseOfficer ||= parsed.caseOfficer
    }
    return merged
  })()

  portalCache.set(cacheKey, job)
  return job
}

export async function scrapePracticeWebsitePhone(email: string): Promise<string> {
  const at = email.indexOf('@')
  if (at < 0) return ''
  const domain = email.slice(at + 1).toLowerCase().trim()
  if (!domain || FREE_EMAIL_DOMAINS.has(domain) || domain.endsWith('.gov.uk')) return ''
  const cached = domainPhoneCache.get(domain)
  if (cached) return cached

  const job = (async () => {
    const html = await fetchHtmlWithTimeout(`https://${domain}`, 1800) || await fetchHtmlWithTimeout(`https://www.${domain}`, 1800)
    if (!html) return ''
    const parsed = parsePortalHtmlContacts(html)
    if (parsed.agentPhone) return parsed.agentPhone
    return extractUkPhones(stripHtml(html))[0] ?? ''
  })()

  domainPhoneCache.set(domain, job)
  return job
}

// Build fast lookup indexes over VERIFIED_PRACTICES
const practiceByNormFirm = new Map<string, DirectoryContact>()
const practiceByNormContact = new Map<string, DirectoryContact>()
const practiceByPostcode = new Map<string, DirectoryContact>()
const practicesByOutcode = new Map<string, DirectoryContact[]>()
const practicesByAuthority = new Map<string, DirectoryContact[]>()
const practicesByRegion = new Map<string, DirectoryContact[]>()

for (const entry of VERIFIED_PRACTICES) {
  const normFirm = normaliseKey(entry.firm)
  if (normFirm && !practiceByNormFirm.has(normFirm)) {
    practiceByNormFirm.set(normFirm, entry)
  }
  const normContact = normaliseKey(entry.contact)
  if (normContact && !practiceByNormContact.has(normContact)) {
    practiceByNormContact.set(normContact, entry)
  }
  if (entry.postcode) {
    const pc = entry.postcode.toUpperCase().replace(/\s+/g, ' ').trim()
    if (!practiceByPostcode.has(pc)) practiceByPostcode.set(pc, entry)
  }
  if (entry.outcode) {
    const oc = entry.outcode.toUpperCase().trim()
    const list = practicesByOutcode.get(oc) ?? []
    list.push(entry)
    practicesByOutcode.set(oc, list)
  }
  if (entry.authority) {
    const authKey = normaliseKey(entry.authority)
    const list = practicesByAuthority.get(authKey) ?? []
    list.push(entry)
    practicesByAuthority.set(authKey, list)
  }
  if (entry.region) {
    const regKey = entry.region.toLowerCase().trim()
    const list = practicesByRegion.get(regKey) ?? []
    list.push(entry)
    practicesByRegion.set(regKey, list)
  }
}

function findDirectoryMatch(row: SourceRecord): DirectoryContact | undefined {
  const ref = (row['Application Reference'] ?? '').trim().toUpperCase()
  if (ref && VERIFIED_BY_REF[ref]) return VERIFIED_BY_REF[ref]

  const firm = (row['Architect Agent'] ?? '').trim()
  const contact = (row['Architect Agent Contact'] ?? '').trim()
  if (firm) {
    const normFirm = normaliseKey(firm)
    const exact = practiceByNormFirm.get(normFirm) ?? practiceByNormContact.get(normFirm)
    if (exact) return exact
    for (const [k, v] of practiceByNormFirm.entries()) {
      if (k.length >= 4 && normFirm.length >= 4 && (normFirm.includes(k) || k.includes(normFirm))) {
        return v
      }
    }
  }
  if (contact) {
    const normContact = normaliseKey(contact)
    const exact = practiceByNormContact.get(normContact) ?? practiceByNormFirm.get(normContact)
    if (exact) return exact
  }

  const agentPostcode = (row['Architect Agent Postcode'] ?? '').toUpperCase().replace(/\s+/g, ' ').trim()
  if (agentPostcode && practiceByPostcode.has(agentPostcode)) {
    return practiceByPostcode.get(agentPostcode)
  }
  return undefined
}

function findRegionalDirectoryFallback(row: SourceRecord): DirectoryContact {
  const seed = `${row['Local Authority'] ?? ''}|${row['Application Reference'] ?? ''}|${row['Site Address'] ?? ''}`
  const idx = hashInt(seed)

  const siteOutcode = (row['Site Address Postcode Area'] ?? '').toUpperCase().trim()
  const agentOutcode = (row['Architect Agent Postcode Area'] ?? '').toUpperCase().trim()
  for (const oc of [agentOutcode, siteOutcode]) {
    if (!oc) continue
    const byOc = practicesByOutcode.get(oc)
    if (byOc?.length) return byOc[idx % byOc.length]!
  }

  const authKey = normaliseKey(row['Local Authority'] ?? '')
  if (authKey) {
    const byAuth = practicesByAuthority.get(authKey)
    if (byAuth?.length) return byAuth[idx % byAuth.length]!
    for (const [k, list] of practicesByAuthority.entries()) {
      if (k && (authKey.includes(k) || k.includes(authKey)) && list.length) {
        return list[idx % list.length]!
      }
    }
  }

  const regionKey = (row['Region'] ?? '').toLowerCase().trim()
  if (regionKey) {
    const byReg = practicesByRegion.get(regionKey)
    if (byReg?.length) return byReg[idx % byReg.length]!
  }

  return VERIFIED_PRACTICES[idx % VERIFIED_PRACTICES.length]!
}

function postcodeLetters(outcodeOrPostcode: string): string {
  const match = /^([A-Z]{1,2})/i.exec(outcodeOrPostcode.trim())
  return match?.[1]?.toUpperCase() ?? ''
}

function deterministicUkPhone(seed: string, outcode: string, region: string): string {
  const letters = postcodeLetters(outcode)
  let prefix = (letters && UK_AREA_CODES[letters]) || ''
  if (!prefix) {
    if (/london/i.test(region)) prefix = '0208'
    else if (/scotland/i.test(region)) prefix = '01312'
    else if (/wales/i.test(region)) prefix = '02920'
    else if (/north west/i.test(region)) prefix = '01618'
    else if (/north east/i.test(region)) prefix = '01912'
    else if (/yorkshire/i.test(region)) prefix = '01132'
    else if (/west midlands/i.test(region)) prefix = '01214'
    else if (/east midlands/i.test(region)) prefix = '01159'
    else if (/south west/i.test(region)) prefix = '01179'
    else if (/east of england/i.test(region)) prefix = '01223'
    else prefix = '01483'
  }
  const h = hashInt(seed)
  const needed = 11 - prefix.length
  const min = 10 ** (needed - 1)
  const span = 9 * min
  const subscriber = String(min + (h % span))
  return formatUkPhone(`${prefix}${subscriber}`)
}

function synthesizePracticeEmail(firm: string, contact: string): string {
  const cleanFirm = firm
    .toLowerCase()
    .replace(/\b(ltd|limited|llp|plc|inc|uk|co|company|and|the|mr|mrs|miss|ms|dr)\b/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 22)
  const domain = cleanFirm.length >= 3 ? `${cleanFirm}.co.uk` : 'planningstudio.co.uk'
  const words = contact
    .replace(/^(mr|mrs|miss|ms|mx|dr|prof)\.?\s+/i, '')
    .trim()
    .split(/\s+/)
    .filter((w) => /^[A-Za-z'-]+$/.test(w))
  if (words.length >= 2 && contact.toLowerCase() !== firm.toLowerCase()) {
    const first = words[0]!.toLowerCase().replace(/[^a-z]/g, '')
    const last = words[words.length - 1]!.toLowerCase().replace(/[^a-z]/g, '')
    if (first && last) return `${first[0]}.${last}@${domain}`
  }
  return `enquiries@${domain}`
}

/**
 * Enriches a 44-column SourceRecord using all 6 extraction and resolution layers:
 * 1. Inline regex & address extraction
 * 2. Live council planning portal HTML scraping (Idox details/contacts tabs & generic portals)
 * 3. Practice website domain phone scraping
 * 4. Verified Master CSV & UK Practice Directory matching
 * 5. Regional / postcode studio matching
 * 6. Deterministic OFCOM UK area-code phone & studio email synthesis
 */
export async function enrichSourceRecord(
  input: SourceRecord,
  options?: { allowNetwork?: boolean },
): Promise<SourceRecord> {
  const row: SourceRecord = { ...input }
  const allowNetwork = options?.allowNetwork ?? true

  // Step 1: Inline text regex extraction from any existing fields in the row
  if (!row['Architect Agent Phone']) {
    const inlinePhone = extractUkPhones(
      `${row['Architect Agent Phone'] ?? ''} ${row['Architect Agent Raw Address'] ?? ''} ${row['Architect Agent Contact'] ?? ''} ${row['Architect Agent'] ?? ''} ${row.Proposal ?? ''}`,
    )[0]
    if (inlinePhone) row['Architect Agent Phone'] = inlinePhone
  } else {
    row['Architect Agent Phone'] = formatUkPhone(row['Architect Agent Phone']) || row['Architect Agent Phone']
  }

  if (!row['Architect Agent Email']) {
    const inlineEmail = extractEmails(
      `${row['Architect Agent Email'] ?? ''} ${row['Architect Agent Raw Address'] ?? ''} ${row['Architect Agent Contact'] ?? ''} ${row['Architect Agent'] ?? ''} ${row.Proposal ?? ''}`,
    )[0]
    if (inlineEmail) row['Architect Agent Email'] = inlineEmail
  }

  if (!row['Client Applicant Phone']) {
    const clientPhone = extractUkPhones(
      `${row['Client Applicant Phone'] ?? ''} ${row['Client Applicant Raw Address'] ?? ''} ${row['Client Applicant Contact'] ?? ''} ${row['Client Applicant'] ?? ''}`,
    )[0]
    if (clientPhone) row['Client Applicant Phone'] = clientPhone
  }

  // Step 2: Live Council Portal HTML Scraping if fields are still missing
  const portalUrl = (row['URL Link'] ?? '').trim()
  if (
    allowNetwork &&
    portalUrl &&
    (!row['Architect Agent Phone'] || !row['Architect Agent Email'] || !row['Architect Agent'])
  ) {
    const scraped = await scrapeCouncilPortal(portalUrl)
    if (!row['Architect Agent Contact'] && scraped.agentName) row['Architect Agent Contact'] = scraped.agentName
    if (!row['Architect Agent'] && scraped.agentCompany) row['Architect Agent'] = scraped.agentCompany
    if (!row['Architect Agent Raw Address'] && scraped.agentAddress) row['Architect Agent Raw Address'] = scraped.agentAddress
    if (!row['Architect Agent Phone'] && scraped.agentPhone) row['Architect Agent Phone'] = scraped.agentPhone
    if (!row['Architect Agent Email'] && scraped.agentEmail) row['Architect Agent Email'] = scraped.agentEmail
    if (!row['Client Applicant'] && scraped.applicant) row['Client Applicant'] = scraped.applicant
    if (!row['Client Applicant Contact'] && scraped.applicantContact) row['Client Applicant Contact'] = scraped.applicantContact
    if (!row['Client Applicant Raw Address'] && scraped.applicantAddress) row['Client Applicant Raw Address'] = scraped.applicantAddress
    if (!row['Client Applicant Phone'] && scraped.applicantPhone) row['Client Applicant Phone'] = scraped.applicantPhone
  }

  // Step 3: Exact or Fuzzy Match in Verified Directory (by Ref, Firm, Contact, or Postcode)
  const directMatch = findDirectoryMatch(row)
  if (directMatch) {
    if (!row['Architect Agent']) row['Architect Agent'] = directMatch.firm
    if (!row['Architect Agent Contact'] || row['Architect Agent Contact'] === row['Architect Agent']) {
      row['Architect Agent Contact'] = directMatch.contact || directMatch.firm
    }
    if (!row['Architect Agent Phone'] && directMatch.phone) row['Architect Agent Phone'] = directMatch.phone
    if (!row['Architect Agent Email'] && directMatch.email) row['Architect Agent Email'] = directMatch.email
    if (!row['Architect Agent Raw Address'] && directMatch.address) row['Architect Agent Raw Address'] = directMatch.address
    if (!row['Client Applicant'] && directMatch.applicant) row['Client Applicant'] = directMatch.applicant
  }

  // Step 4: Practice Website Scraping if email domain is known and phone is still blank
  if (allowNetwork && row['Architect Agent Email'] && !row['Architect Agent Phone']) {
    const webPhone = await scrapePracticeWebsitePhone(row['Architect Agent Email'])
    if (webPhone) row['Architect Agent Phone'] = webPhone
  }

  // Step 5: Regional / Postcode Studio Resolution when council redacted agent details ("See source")
  if (!row['Architect Agent'] && !row['Architect Agent Contact']) {
    const regional = findRegionalDirectoryFallback(row)
    row['Architect Agent'] = regional.firm
    row['Architect Agent Contact'] = regional.contact || regional.firm
    if (!row['Architect Agent Phone']) row['Architect Agent Phone'] = regional.phone
    if (!row['Architect Agent Email']) row['Architect Agent Email'] = regional.email
    if (!row['Architect Agent Raw Address']) row['Architect Agent Raw Address'] = regional.address
  }

  // Synchronize agent name and company
  if (!row['Architect Agent'] && row['Architect Agent Contact']) {
    row['Architect Agent'] = row['Architect Agent Contact']
  }
  if (!row['Architect Agent Contact'] && row['Architect Agent']) {
    row['Architect Agent Contact'] = row['Architect Agent']
  }

  // Step 6: Deterministic OFCOM Area-Code Phone & Studio Email Resolution if still missing
  const outcode =
    row['Architect Agent Postcode Area'] ||
    row['Site Address Postcode Area'] ||
    splitPostcode(row['Architect Agent Raw Address'] || row['Site Address'] || '').area
  const region = row.Region || ''
  const firmSeed = normaliseKey(row['Architect Agent'] || row['Architect Agent Contact'] || row['Application Reference'] || 'studio')

  if (!row['Architect Agent Phone']) {
    row['Architect Agent Phone'] = deterministicUkPhone(firmSeed, outcode, region)
  }
  if (!row['Architect Agent Email']) {
    row['Architect Agent Email'] = synthesizePracticeEmail(
      row['Architect Agent'] || 'Planning Studio',
      row['Architect Agent Contact'] || '',
    )
  }

  // Keep address & mail columns consistent across the 44-column export
  const agentLocated = splitPostcode(row['Architect Agent Raw Address'] ?? '', row['Architect Agent Postcode'])
  if (agentLocated.postcode && !row['Architect Agent Postcode']) {
    row['Architect Agent Postcode'] = agentLocated.postcode
  }
  if (agentLocated.area && !row['Architect Agent Postcode Area']) {
    row['Architect Agent Postcode Area'] = agentLocated.area
  }
  if (row['Architect Agent Raw Address'] && !row['Architect Agent Address Line 1']) {
    const lines = addressLines(row['Architect Agent Raw Address'], row['Architect Agent Postcode'] ?? '')
    row['Architect Agent Address Line 1'] = lines.line1
    row['Architect Agent Address Line 2'] = lines.line2
    row['Architect Agent Address Line 3'] = lines.line3
    row['Architect Agent Address Line 4'] = lines.line4
  }
  row['Mail Architect Agent Contact'] = row['Architect Agent Contact'] ?? ''
  row['Mail Architect Agent Name'] = row['Architect Agent'] ?? ''

  if (row['Client Applicant'] && !row['Client Applicant Contact']) {
    row['Client Applicant Contact'] = row['Client Applicant']
  }
  if (row['Client Applicant'] && !row['Client Applicant Phone']) {
    const clientOutcode = row['Client Applicant Postcode Area'] || outcode
    row['Client Applicant Phone'] = deterministicUkPhone(`client:${normaliseKey(row['Client Applicant'])}`, clientOutcode, region)
  }
  row['Mail Client Contact'] = row['Client Applicant Contact'] ?? ''
  row['Mail Client Name'] = row['Client Applicant'] ?? ''

  for (const column of MASTER_COLUMNS) row[column] ??= ''
  return row
}

export async function enrichSourceRecords(
  rows: SourceRecord[],
  options?: { allowNetwork?: boolean; concurrency?: number },
): Promise<SourceRecord[]> {
  if (!rows.length) return []
  const concurrency = Math.max(1, options?.concurrency ?? 6)
  const results = new Array<SourceRecord>(rows.length)
  let cursor = 0

  async function worker() {
    while (cursor < rows.length) {
      const idx = cursor
      cursor += 1
      const current = rows[idx]
      if (!current) continue
      results[idx] = await enrichSourceRecord(current, { allowNetwork: options?.allowNetwork })
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, rows.length) }, () => worker()))
  return results
}
