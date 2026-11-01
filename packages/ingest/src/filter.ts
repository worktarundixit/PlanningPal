import type { FilterConfig, PlanItRecord } from './types.ts'
import { blank } from './clean.ts'

export const DEFAULT_FILTER: FilterConfig = {
  dropTypes: ['Trees', 'Conditions', 'Advertising', 'Telecoms', 'Amendment'],
  patterns: [
    { reason: 'tree works', source: String.raw`\b(tpo|tca)\b|works to trees|tree works|crown (reduce|lift|thin)|re-?pollard|\bpollard\b|fell(?:ing)? \d+ tree` },
    { reason: 'discharge of conditions', source: String.raw`discharge of conditions?` },
    { reason: 'non-material amendment', source: String.raw`non-?material amendment|\bNMA\b|minor material amendment` },
    { reason: 'lawful development certificate', source: String.raw`certificate of lawfulness|lawful development|\bLDC\b` },
    { reason: 'advertisement', source: String.raw`advertisement consent|consent to display an advertisement|\badvert(isement)?s?\b` },
    { reason: 'prior notification', source: String.raw`prior notification|prior approval` },
  ],
}

export function rejectionReason(record: PlanItRecord, config: FilterConfig = DEFAULT_FILTER): string | null {
  const type = blank(record.app_type)
  if (config.dropTypes.some((item) => item.toLowerCase() === type.toLowerCase())) return `type ${type}`
  const haystack = [record.description, record.name, record.other_fields?.application_type, record.app_type].map(blank).join(' \n ')
  for (const pattern of config.patterns) {
    if (new RegExp(pattern.source, 'i').test(haystack)) return pattern.reason
  }
  return null
}
