const POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/i

const BLANK_VALUES = new Set(['', 'see source', 'unknown', 'n/a', 'na', 'none', 'null', '-'])

export function blank(value: unknown): string {
  if (value === null || value === undefined) return ''
  const text = String(value).replace(/\s+/g, ' ').trim()
  if (BLANK_VALUES.has(text.toLowerCase())) return ''
  return text
}

export function splitPostcode(address: string, explicit?: string) {
  const source = `${explicit ?? ''} ${address}`
  const match = source.toUpperCase().match(POSTCODE)
  if (!match || !match[1] || !match[2]) return { postcode: '', area: '' }
  return { postcode: `${match[1]} ${match[2]}`, area: match[1] }
}

export function addressLines(raw: string, postcode: string) {
  const without = postcode ? raw.replace(new RegExp(postcode.replace(' ', '\\s*'), 'i'), '').replace(/,\s*,/g, ',').replace(/,\s*$/, '').trim() : raw.trim()
  const parts = without.split(',').map((part) => part.trim()).filter(Boolean)
  return {
    line1: parts[0] ?? without,
    line2: parts[1] ?? '',
    line3: parts[2] ?? '',
    line4: parts[3] ?? '',
  }
}

export function formatPublicationDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim())
  if (!match) return iso.trim()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[Number(match[2]) - 1]
  if (!month) return iso.trim()
  return `${Number(match[3])} ${month} ${match[1]}`
}

export function applicationReference(record: { uid?: string | null; reference?: string | null; name?: string | null }) {
  const uid = blank(record.uid)
  if (uid) return uid
  const reference = blank(record.reference)
  if (reference) return reference
  const name = blank(record.name)
  const slash = name.indexOf('/')
  return slash >= 0 ? name.slice(slash + 1) : name
}
