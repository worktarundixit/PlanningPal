import { PLANIT_USER_AGENT } from './planit.ts'

export type EnrichedContacts = {
  applicantName: string
  applicantCompany: string
  applicantAddress: string
  agentName: string
  agentCompany: string
  agentAddress: string
  agentPhone: string
  agentEmail: string
}

function cleanCell(raw: string | undefined): string {
  if (!raw) return ''
  const text = raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()
  if (/^(not available|n\/a|none|see source|-|unknown)$/i.test(text)) return ''
  return text
}

export function idoxDetailsUrl(portalUrl: string): string | null {
  if (!portalUrl || !/applicationDetails\.do/i.test(portalUrl)) return null
  try {
    const parsed = new URL(portalUrl)
    parsed.searchParams.set('activeTab', 'details')
    return parsed.toString()
  } catch {
    return null
  }
}

export function parseIdoxDetailsHtml(html: string): EnrichedContacts {
  const rows = new Map<string, string>()
  const pattern = /<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/gi
  let match: RegExpExecArray | null
  while ((match = pattern.exec(html)) !== null) {
    const label = cleanCell(match[1]).toLowerCase()
    const value = cleanCell(match[2])
    if (label && value) {
      rows.set(label, value)
    }
  }
  const get = (...keys: string[]) => {
    for (const key of keys) {
      const found = rows.get(key.toLowerCase())
      if (found) return found
    }
    return ''
  }
  return {
    applicantName: get('applicant name', 'applicant'),
    applicantCompany: get('applicant company name', 'company name'),
    applicantAddress: get('applicant address'),
    agentName: get('agent name', 'agent'),
    agentCompany: get('agent company name', 'agent company'),
    agentAddress: get('agent address'),
    agentPhone: get('agent phone number', 'phone number', 'telephone number'),
    agentEmail: get('agent email', 'email', 'email address'),
  }
}

export async function fetchIdoxContacts(
  portalUrl: string,
  options: { fetchImpl?: typeof fetch; timeoutMs?: number } = {},
): Promise<EnrichedContacts | null> {
  const detailsUrl = idoxDetailsUrl(portalUrl)
  if (!detailsUrl) return null
  const fetchImpl = options.fetchImpl ?? fetch
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 12_000)
  try {
    const response = await fetchImpl(detailsUrl, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': PLANIT_USER_AGENT,
      },
      signal: controller.signal,
    })
    if (!response.ok) return null
    const html = await response.text()
    const parsed = parseIdoxDetailsHtml(html)
    const hasData = Boolean(
      parsed.applicantName || parsed.applicantCompany || parsed.agentName || parsed.agentCompany || parsed.agentEmail,
    )
    return hasData ? parsed : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

