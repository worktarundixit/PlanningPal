import { inflateRawSync, inflateSync } from 'node:zlib'
import { blank } from './clean.ts'
import { extractEmails, extractUkPhones, formatUkPhone } from './contacts.ts'

function decodePdfLiteralString(raw: string): string {
  let out = ''
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i]!
    if (ch !== '\\') {
      out += ch
      continue
    }
    const next = raw[i + 1]
    if (!next) break
    if (next >= '0' && next <= '7') {
      let oct = next
      if (raw[i + 2] && raw[i + 2]! >= '0' && raw[i + 2]! <= '7') oct += raw[i + 2]
      if (raw[i + 3] && raw[i + 3]! >= '0' && raw[i + 3]! <= '7') oct += raw[i + 3]
      out += String.fromCharCode(Number.parseInt(oct, 8))
      i += oct.length
      continue
    }
    i += 1
    if (next === 'n') out += '\n'
    else if (next === 'r') out += '\r'
    else if (next === 't') out += '\t'
    else if (next === 'b') out += '\b'
    else if (next === 'f') out += '\f'
    else if (next === '\n' || next === '\r') continue
    else out += next
  }
  if (out.length >= 2 && out.charCodeAt(0) === 0xfe && out.charCodeAt(1) === 0xff) {
    let utf16 = ''
    for (let i = 2; i + 1 < out.length; i += 2) {
      const code = (out.charCodeAt(i) << 8) | out.charCodeAt(i + 1)
      if (code >= 32 || code === 10 || code === 13) utf16 += String.fromCharCode(code)
    }
    return utf16
  }
  return out
}

function decodeHexToString(hex: string, cmap: Map<number, string>): string {
  const clean = hex.replace(/\s+/g, '')
  if (!clean) return ''
  if (cmap.size > 0 && clean.length % 4 === 0) {
    let mapped = ''
    let hits = 0
    for (let i = 0; i < clean.length; i += 4) {
      const code = Number.parseInt(clean.slice(i, i + 4), 16)
      const ch = cmap.get(code)
      if (ch !== undefined) {
        mapped += ch
        hits += 1
      } else if (code >= 32 && code <= 126) {
        mapped += String.fromCharCode(code)
      }
    }
    if (hits > 0) return mapped
  }
  if (clean.startsWith('FEFF') || clean.startsWith('feff')) {
    let utf16 = ''
    for (let i = 4; i + 3 < clean.length; i += 4) {
      const code = Number.parseInt(clean.slice(i, i + 4), 16)
      if (code >= 32 || code === 10 || code === 13) utf16 += String.fromCharCode(code)
    }
    return utf16
  }
  let ascii = ''
  for (let i = 0; i + 1 < clean.length; i += 2) {
    const code = Number.parseInt(clean.slice(i, i + 2), 16)
    if (cmap.has(code)) ascii += cmap.get(code)
    else if (code >= 32 && code <= 126) ascii += String.fromCharCode(code)
  }
  return ascii
}

function parseToUnicodeCmap(streamText: string, cmap: Map<number, string>) {
  const bfcharRegex = /beginbfchar([\s\S]*?)endbfchar/g
  let match: RegExpExecArray | null
  while ((match = bfcharRegex.exec(streamText)) !== null) {
    const body = match[1] ?? ''
    const pairRegex = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g
    let pair: RegExpExecArray | null
    while ((pair = pairRegex.exec(body)) !== null) {
      const src = Number.parseInt(pair[1]!, 16)
      const dstHex = pair[2]!
      let dst = ''
      for (let i = 0; i + 3 < dstHex.length; i += 4) {
        dst += String.fromCharCode(Number.parseInt(dstHex.slice(i, i + 4), 16))
      }
      if (!dst && dstHex.length === 2) {
        dst = String.fromCharCode(Number.parseInt(dstHex, 16))
      }
      if (dst) cmap.set(src, dst)
    }
  }

  const bfrangeRegex = /beginbfrange([\s\S]*?)endbfrange/g
  while ((match = bfrangeRegex.exec(streamText)) !== null) {
    const body = match[1] ?? ''
    const rangeRegex = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g
    let range: RegExpExecArray | null
    while ((range = rangeRegex.exec(body)) !== null) {
      const start = Number.parseInt(range[1]!, 16)
      const end = Number.parseInt(range[2]!, 16)
      const targetStart = Number.parseInt(range[3]!, 16)
      if (end >= start && end - start <= 512) {
        for (let offset = 0; offset <= end - start; offset += 1) {
          cmap.set(start + offset, String.fromCharCode(targetStart + offset))
        }
      }
    }
  }
}

function extractTextFromContentStream(streamText: string, cmap: Map<number, string>): string {
  const lines: string[] = []
  let lastString = ''

  const tokenRegex = /\((?:\\.|[^\\()])*\)|<[0-9A-Fa-f\s]+>|\[(?:\\.|[^[\]])*\]|\b(?:BT|ET|Td|TD|Tm|T\*|Tj|TJ)\b/g
  let match: RegExpExecArray | null

  while ((match = tokenRegex.exec(streamText)) !== null) {
    const token = match[0]
    if (token === 'BT' || token === 'ET' || token === 'T*') {
      lastString = ''
    } else if (token.startsWith('(') && token.endsWith(')')) {
      lastString = decodePdfLiteralString(token.slice(1, -1))
    } else if (token.startsWith('<') && token.endsWith('>')) {
      lastString = decodeHexToString(token.slice(1, -1), cmap)
    } else if (token === 'Tj') {
      if (lastString.trim()) {
        lines.push(lastString.trim())
      }
      lastString = ''
    } else if (token.startsWith('[') && token.endsWith(']')) {
      const inner = token.slice(1, -1)
      const partRegex = /\((?:\\.|[^\\()])*\)|<[0-9A-Fa-f\s]+>|-?\d+(?:\.\d+)?/g
      let part: RegExpExecArray | null
      let chunk = ''
      while ((part = partRegex.exec(inner)) !== null) {
        const p = part[0]
        if (p.startsWith('(') && p.endsWith(')')) {
          chunk += decodePdfLiteralString(p.slice(1, -1))
        } else if (p.startsWith('<') && p.endsWith('>')) {
          chunk += decodeHexToString(p.slice(1, -1), cmap)
        } else {
          const kern = Number(p)
          if (kern < -120 && chunk && !chunk.endsWith(' ')) chunk += ' '
        }
      }
      lastString = chunk
    } else if (token === 'TJ') {
      if (lastString.trim()) {
        lines.push(lastString.trim())
      }
      lastString = ''
    }
  }
  return lines.join('\n')
}

/**
 * Pure-TypeScript PDF text extractor using Node's built-in zlib.
 * Decompresses FlateDecode streams, decodes ToUnicode CMaps, and extracts AcroForm field values.
 */
export function extractTextFromPdfBuffer(input: Uint8Array | Buffer): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input.buffer, input.byteOffset, input.byteLength)
  const rawLatin1 = buf.toString('latin1')
  const decompressedStreams: string[] = []
  const cmap = new Map<number, string>()

  // 1. Extract AcroForm /T (...) /V (...) pairs if the PDF has interactive form fields
  const formLines: string[] = []
  const acroRegex = /\/T\s*\(((?:\\.|[^\\()])*)\)[\s\S]{0,160}?\/V\s*\(((?:\\.|[^\\()])*)\)/g
  let acroMatch: RegExpExecArray | null
  while ((acroMatch = acroRegex.exec(rawLatin1)) !== null) {
    const fieldName = decodePdfLiteralString(acroMatch[1] ?? '').trim()
    const fieldVal = decodePdfLiteralString(acroMatch[2] ?? '').trim()
    if (fieldName && fieldVal) {
      formLines.push(`${fieldName}: ${fieldVal}`)
    }
  }

  // 2. Locate and decompress all stream ... endstream blocks
  const streamToken = 'stream'
  const endToken = 'endstream'
  let searchFrom = 0
  while (searchFrom < rawLatin1.length) {
    const startIdx = rawLatin1.indexOf(streamToken, searchFrom)
    if (startIdx < 0) break
    const prevChar = startIdx > 0 ? rawLatin1[startIdx - 1] : ''
    if (prevChar && /[A-Za-z0-9/]/.test(prevChar)) {
      searchFrom = startIdx + streamToken.length
      continue
    }
    let dataStart = startIdx + streamToken.length
    if (rawLatin1[dataStart] === '\r' && rawLatin1[dataStart + 1] === '\n') dataStart += 2
    else if (rawLatin1[dataStart] === '\n' || rawLatin1[dataStart] === '\r') dataStart += 1
    else {
      searchFrom = dataStart
      continue
    }
    const endIdx = rawLatin1.indexOf(endToken, dataStart)
    if (endIdx < 0) break
    let dataEnd = endIdx
    if (rawLatin1[dataEnd - 1] === '\n') dataEnd -= 1
    if (rawLatin1[dataEnd - 1] === '\r') dataEnd -= 1

    const headerSlice = rawLatin1.slice(Math.max(0, startIdx - 350), startIdx)
    const slice = buf.subarray(dataStart, dataEnd)
    let decoded = ''
    if (/\/FlateDecode\b/.test(headerSlice)) {
      try {
        decoded = inflateSync(slice).toString('latin1')
      } catch {
        try {
          decoded = inflateRawSync(slice).toString('latin1')
        } catch {
          decoded = ''
        }
      }
    } else if (!/\/DCTDecode\b|\/JPXDecode\b|\/JBIG2Decode\b|\/CCITTFaxDecode\b/.test(headerSlice)) {
      decoded = slice.toString('latin1')
    }

    if (decoded) {
      if (decoded.includes('beginbfchar') || decoded.includes('beginbfrange')) {
        parseToUnicodeCmap(decoded, cmap)
      }
      decompressedStreams.push(decoded)
    }
    searchFrom = endIdx + endToken.length
  }

  // 3. Extract text runs from all content streams using the accumulated CMap
  const textBlocks: string[] = [...formLines]
  for (const streamText of decompressedStreams) {
    if (streamText.includes('Tj') || streamText.includes('TJ')) {
      const extracted = extractTextFromContentStream(streamText, cmap)
      if (extracted.trim()) textBlocks.push(extracted)
    }
  }

  return textBlocks.join('\n')
}

export type ApplicationFormContacts = {
  agentName: string
  agentCompany: string
  agentAddress: string
  agentPostcode: string
  agentPhone: string
  agentEmail: string
  applicantContact: string
  applicantName: string
  applicantCompany: string
  applicant: string
  applicantAddress: string
  applicantPostcode: string
  applicantPhone: string
  applicantEmail: string
}

function matchLabelValue(section: string, labelPattern: RegExp): string {
  const match = labelPattern.exec(section)
  if (!match?.[1]) return ''
  const val = blank(match[1].replace(/^[:\s-]+/, '').trim())
  if (
    /^(title|first name|last name|surname|company name|address|line 1|line 2|line 3|town|city|postcode|country|telephone|primary number|secondary number|mobile|fax|email|agent|applicant|none|n\/a)/i.test(val) ||
    /\b(redacted|withheld)\b|\*{3,}/i.test(val)
  ) {
    return ''
  }
  return val
}

function parseSectionPersonAndCompany(section: string) {
  const title = matchLabelValue(section, /\bTitle\s*[:\n]+\s*([^\n\r]{1,20})/i)
  const firstName = matchLabelValue(section, /\bFirst\s+name\s*[:\n]+\s*([^\n\r]{1,60})/i)
  const lastName = matchLabelValue(section, /\b(?:Last\s+name|Surname|Family\s+name)\s*[:\n]+\s*([^\n\r]{1,60})/i)
  const explicitName = matchLabelValue(section, /\b(?:Agent\s+name|Applicant\s+name|Contact\s+name|Full\s+name)\s*[:\n]+\s*([^\n\r]{2,80})/i)
  const company = matchLabelValue(section, /\b(?:Company\s+name|Company|Organisation|Firm\s+name|Practice\s+name)\s*[:\n]+\s*([^\n\r]{2,100})/i)

  const combinedName = [title, firstName, lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim() || explicitName

  const line1 = matchLabelValue(section, /\b(?:Address\s+line\s*1|Line\s*1|Street\s+address|Address)\s*[:\n]+\s*([^\n\r]{2,100})/i)
  const line2 = matchLabelValue(section, /\b(?:Address\s+line\s*2|Line\s*2)\s*[:\n]+\s*([^\n\r]{2,80})/i)
  const line3 = matchLabelValue(section, /\b(?:Address\s+line\s*3|Line\s*3|Town\/City|Town|City)\s*[:\n]+\s*([^\n\r]{2,80})/i)
  const postcode = matchLabelValue(section, /\b(?:Postcode|Post\s+code)\s*[:\n]+\s*([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})/i)
  const address = [line1, line2, line3, postcode].filter(Boolean).join(', ')

  const explicitPhone =
    matchLabelValue(section, /\b(?:Telephone\s+number|Primary\s+number|Mobile\s+number|Secondary\s+number|Daytime\s+telephone|Phone\s+number|Tel(?:ephone)?)\s*[:\n]+\s*([^\n\r]{6,35})/i)
  const phone = formatUkPhone(explicitPhone) || extractUkPhones(section)[0] || ''

  const explicitEmail =
    matchLabelValue(section, /\b(?:Email\s+address|E-mail\s+address|Email|E-mail)\s*[:\n]+\s*([^\s\n\r]{5,100})/i)
  const email =
    extractEmails(explicitEmail)[0] ||
    extractEmails(section).find((e) => !e.endsWith('.gov.uk') && !e.endsWith('planningportal.co.uk')) ||
    ''

  return {
    person: combinedName,
    company,
    address,
    postcode,
    phone,
    email,
  }
}

/**
 * Parses extracted text from a UK 1APP Planning Application Form PDF (or Design & Access Statement / Drawing PDF)
 * to extract Agent and Applicant names, companies, addresses, phone numbers, and emails.
 */
export function parseApplicationFormContacts(pdfText: string): Partial<ApplicationFormContacts> {
  if (!pdfText || !pdfText.trim()) return {}
  const normalized = pdfText.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ')
  const result: Partial<ApplicationFormContacts> = {}

  // Locate "Applicant Details" and "Agent Details" sections in standard 1APP Application Form
  const applicantMatch = /\b(?:\d+\.\s*)?Applicant\s+(?:Details|Information|Name\s+and\s+Address)\b/i.exec(normalized)
  const agentMatch = /\b(?:\d+\.\s*)?(?:Agent|Architect)\s+(?:Details|Information|Name\s+and\s+Address)\b/i.exec(normalized)
  const declarationMatch = /\b(?:\d+\.\s*)?Declaration\b/i.exec(normalized)

  if (applicantMatch) {
    const start = applicantMatch.index
    const end = agentMatch && agentMatch.index > start ? agentMatch.index : Math.min(normalized.length, start + 2200)
    const section = normalized.slice(start, end)
    const parsed = parseSectionPersonAndCompany(section)
    if (parsed.person) {
      result.applicantContact = parsed.person
      result.applicantName = parsed.person
    }
    if (parsed.company) result.applicantCompany = parsed.company
    if (parsed.company || parsed.person) result.applicant = parsed.company || parsed.person
    if (parsed.address) result.applicantAddress = parsed.address
    if (parsed.postcode) result.applicantPostcode = parsed.postcode
    if (parsed.phone) result.applicantPhone = parsed.phone
    if (parsed.email) result.applicantEmail = parsed.email
  }

  if (agentMatch) {
    const start = agentMatch.index
    const nextSectionMatch = /\n\s*(?:\d+\.\s+)?(?:Site\s+Address|Description\s+of\s+Proposed|Materials|Pedestrian|Trees|Pre-application|Authority\s+Employee|Certificates|Declaration)\b/i.exec(
      normalized.slice(start + 20),
    )
    const end = nextSectionMatch ? start + 20 + nextSectionMatch.index : Math.min(normalized.length, start + 2500)
    const section = normalized.slice(start, end)
    const parsed = parseSectionPersonAndCompany(section)
    if (parsed.person) result.agentName = parsed.person
    if (parsed.company) result.agentCompany = parsed.company
    if (parsed.address) result.agentAddress = parsed.address
    if (parsed.postcode) result.agentPostcode = parsed.postcode
    if (parsed.phone) result.agentPhone = parsed.phone
    if (parsed.email) result.agentEmail = parsed.email
  }

  // Fallback to Declaration section at the bottom of the 1APP Application Form
  if (declarationMatch && (!result.agentName || !result.applicant)) {
    const declSection = normalized.slice(declarationMatch.index, Math.min(normalized.length, declarationMatch.index + 1800))
    const parsedDecl = parseSectionPersonAndCompany(declSection)
    if (!result.agentName && parsedDecl.person) result.agentName = parsedDecl.person
    if (!result.agentCompany && parsedDecl.company) result.agentCompany = parsedDecl.company
    const onBehalf = matchLabelValue(declSection, /\bOn\s+behalf\s+of\s*[:\n]\s*([^\n\r]{2,80})/i)
    if (!result.applicant && onBehalf) result.applicant = onBehalf
  }

  // Whole-document fallback for phone & email (e.g. letterhead on Cover Letter / Design & Access Statement / Drawings)
  if (!result.agentPhone) {
    const allPhones = extractUkPhones(normalized)
    if (allPhones[0]) result.agentPhone = allPhones[0]
  }
  if (!result.agentEmail) {
    const allEmails = extractEmails(normalized).filter(
      (e) => !e.endsWith('.gov.uk') && !e.endsWith('planningportal.co.uk') && !e.endsWith('planit.org.uk'),
    )
    if (allEmails[0]) result.agentEmail = allEmails[0]
  }

  if (result.agentCompany && !result.agentName) result.agentName = result.agentCompany
  if (result.agentName && !result.agentCompany) result.agentCompany = result.agentName

  return result
}
