import { LPA_RECORDS, labelsForCouncil, normaliseAuthorityLabel } from '@planningpal/shared'
import { describe, expect, it } from 'vitest'
import { lookupAuthority } from './gazetteer.ts'

describe('authority labels', () => {
  it('normalises ampersands and punctuation the same way as the word and', () => {
    expect(normaliseAuthorityLabel('Hammersmith & Fulham')).toBe('hammersmith and fulham')
    expect(normaliseAuthorityLabel('Hammersmith and Fulham')).toBe('hammersmith and fulham')
    expect(normaliseAuthorityLabel('  Bournemouth, Christchurch & Poole ')).toBe('bournemouth christchurch and poole')
  })

  it('includes the short name ingest stores for each official council', () => {
    expect(labelsForCouncil('London Borough of Camden').has('Camden')).toBe(true)
    expect(labelsForCouncil('London Borough of Hammersmith & Fulham').has('Hammersmith and Fulham')).toBe(true)
    expect(labelsForCouncil('Adur District Council').has('Adur and Worthing')).toBe(true)
    expect(labelsForCouncil('Worthing Borough Council').has('Adur and Worthing')).toBe(true)
    expect(labelsForCouncil('Babergh District Council').has('Babergh and Mid Suffolk')).toBe(true)
    expect(labelsForCouncil('Mid Suffolk District Council').has('Babergh and Mid Suffolk')).toBe(true)
    const cumberland = labelsForCouncil('Cumberland Council')
    expect(cumberland.has('Allerdale')).toBe(true)
    expect(cumberland.has('Carlisle')).toBe(true)
    expect(cumberland.has('Copeland')).toBe(true)
    expect(labelsForCouncil('City of London Corporation').has('City of London')).toBe(true)
    expect(labelsForCouncil('Folkestone and Hythe Council').has('Shepway')).toBe(true)
    expect(labelsForCouncil("Borough Council of King's Lynn and West Norfolk").has('Kings Lynn')).toBe(true)
    expect(labelsForCouncil('Council of the Isles of Scilly').has('Isles of Scilly')).toBe(true)
    expect(labelsForCouncil('Birmingham City Council').has('Birmingham')).toBe(true)
    expect(lookupAuthority('Birmingham').name).toBe('Birmingham')
    expect([...labelsForCouncil('Nowhere Borough Council')]).toEqual(['Nowhere Borough Council'])
  })

  it('matches every ingestible active authority to the name ingest stores', () => {
    const ingestible = LPA_RECORDS.filter((row) => row.status === 'active' && row.coverage !== 'unavailable')
    expect(ingestible).toHaveLength(377)
    const unmatched = ingestible.flatMap((row) => {
      const labels = new Set([...labelsForCouncil(row.name)].map((label) => normaliseAuthorityLabel(label)))
      return row.planitQueryAreas
        .filter((area) => !labels.has(normaliseAuthorityLabel(lookupAuthority(area).name)))
        .map((area) => `${row.name} -> ${area} (${lookupAuthority(area).name})`)
    })
    expect(unmatched).toEqual([])
    expect(ingestible.every((row) => row.planitQueryAreas.length > 0)).toBe(true)

    const oldMatches = ingestible.filter((row) => row.planitQueryAreas.every((area) => {
      const stored = lookupAuthority(area).name.toLowerCase()
      const official = row.name.toLowerCase()
      return stored === official || stored.includes(official)
    })).length
    expect(oldMatches).toBe(0)
  })
})
