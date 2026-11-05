const UNIT = /(\d+)\s*(?:no\.?\s*)?(?:x\s*)?(dwellings|dwellinghouses|dwellinghouse|houses|house|flats|apartments|units|homes|bungalows)\b/i
const FLOORSPACE = /(\d[\d,]*(?:\.\d+)?)\s*(?:sq\.?\s*m|sqm|m2|m²|square metres)/i

const RATES: Record<string, [number, number]> = {
  COMMERCIAL: [1500, 2200],
  HEALTHCARE: [2400, 3600],
  EDUCATION: [1800, 2600],
  INDUSTRIAL: [900, 1400],
}

export function extractUnits(text: string): number | null {
  const match = text.match(UNIT)
  if (match?.[1]) return Number(match[1])
  if (/\b(?:a|one|single)\s+(?:new\s+|detached\s+|two-storey\s+)?(?:dwellinghouse|dwelling|house|bungalow)\b/i.test(text)) return 1
  if (/\berection of\s+(?:a\s+|one\s+)?(?:new\s+)?(?:dwellinghouse|dwelling|house|bungalow)\b/i.test(text)) return 1
  return null
}

export function extractFloorspace(text: string): number | null {
  const match = text.match(FLOORSPACE)
  if (!match?.[1]) return null
  const value = Number(match[1].replaceAll(',', ''))
  return Number.isFinite(value) && value > 0 ? value : null
}

export function classifyScheme(text: string, appSize: string) {
  const units = extractUnits(text)
  const residential = Boolean(units) || /\b(dwelling|house|flat|apartment|bungalow|residential)\b/i.test(text)
  let category = ''
  if (residential && units) category = 'HOUSING UNITS'
  else if (/\b(office|retail|shop|warehouse|industrial|commercial)\b/i.test(text)) category = 'COMMERCIAL'
  else if (/\b(hospital|clinic|surgery|care home|nursing home)\b/i.test(text)) category = 'HEALTHCARE'
  else if (/\b(school|college|university|nursery)\b/i.test(text)) category = 'EDUCATION'
  else if (/\berection of\b|\bconstruct(?:ion)? of\b|\bredevelopment\b/i.test(text)) category = 'NEW BUILD'
  else if (/\bextension\b/i.test(text)) category = 'EXTENSION'
  let propType = ''
  if (/\bflats|apartments\b/i.test(text)) propType = 'Flats'
  else if (residential) propType = 'Dwelling'
  else if (category === 'COMMERCIAL') propType = 'Commercial'
  else if (category === 'EXTENSION') propType = 'Extension'
  else if (appSize) propType = ''
  return { category, propType, units, floorspace: extractFloorspace(text) }
}

/** PRD heuristic with keyword and application-size fallback. */
export function estimateValue(
  text: string,
  category: string,
  units: number | null,
  floorspace: number | null,
  appSize = '',
) {
  let fromPounds: number | null = null
  let toPounds: number | null = null
  if ((category === 'HOUSING UNITS' || category === 'NEW BUILD') && units && units > 0) {
    fromPounds = units * 180_000
    toPounds = units * 280_000
  } else if (floorspace && floorspace > 0) {
    const [low, high] = RATES[category] ?? [1400, 2100]
    fromPounds = floorspace * low
    toPounds = floorspace * high
  } else if (/hotel|supermarket|mixed-use|hospital|tower|student accommodation|data centre/i.test(text)) {
    fromPounds = 4_000_000
    toPounds = 12_000_000
  } else if (appSize.toLowerCase() === 'large' || /\b(?:major development|substantial redevelopment|multi-storey)\b/i.test(text)) {
    fromPounds = 2_500_000
    toPounds = 6_000_000
  } else if (appSize.toLowerCase() === 'medium' || /\b(?:erection of|demolition and erection|new building)\b/i.test(text)) {
    fromPounds = 750_000
    toPounds = 2_000_000
  } else if (appSize.toLowerCase() === 'small' || category === 'EXTENSION' || /\b(?:extension|alteration|refurbishment|conversion|loft)\b/i.test(text)) {
    fromPounds = 120_000
    toPounds = 350_000
  }

  if (fromPounds === null || toPounds === null) return null
  return {
    from: (fromPounds / 1_000_000).toFixed(3),
    to: (toPounds / 1_000_000).toFixed(3),
    estimated: true,
  }
}
