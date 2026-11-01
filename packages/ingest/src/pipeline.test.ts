import { readFileSync } from 'node:fs'
import { MASTER_COLUMNS } from '@planningpal/shared'
import { describe, expect, it } from 'vitest'
import { rejectionReason } from './filter.ts'
import { mapPlanItRecord } from './map.ts'
import { planItUrl } from './planit.ts'
import { transformRecords } from './transform.ts'
import type { PlanItRecord } from './types.ts'
import { splitPostcode } from './clean.ts'

const fixture = JSON.parse(readFileSync(new URL('../fixtures/last24h.json', import.meta.url), 'utf8')) as PlanItRecord[]

describe('planit mapping and filters', () => {
  it('splits a UK postcode and its area', () => {
    expect(splitPostcode('78A Osborne Road Forest Gate London E7 0PH')).toEqual({ postcode: 'E7 0PH', area: 'E7' })
  })

  it('builds the PlanIt URL with index pagination', () => {
    const url = new URL(planItUrl({ recentDays: 3, pageSize: 300, authority: 'Camden' }, 300))
    expect(url.searchParams.get('recent')).toBe('3')
    expect(url.searchParams.get('pg_sz')).toBe('300')
    expect(url.searchParams.get('index')).toBe('300')
    expect(url.searchParams.get('auth')).toBe('Camden')
  })

  it('drops tree works, certificates, advertisements and prior notifications', () => {
    const tree = fixture.find((record) => record.uid === '26/02221/TCA')
    expect(rejectionReason(tree!)).toMatch(/tree|type Trees/)
    expect(rejectionReason({ description: 'Application for a Certificate of Lawfulness for a proposed garden room.', app_type: 'Outline' })).toBe('lawful development certificate')
    expect(rejectionReason({ description: 'Discharge of condition 4 (materials) of permission 24/001.', app_type: 'Conditions' })).toBeTruthy()
    expect(rejectionReason({ description: 'Consent to display an advertisement.', app_type: 'Advertising' })).toBeTruthy()
    expect(rejectionReason({ description: 'Prior notification for a larger home extension.', app_type: 'Other' })).toBe('prior notification')
  })

  it('maps a real dwelling and leaves unpublished contacts blank', () => {
    const record = fixture.find((item) => item.uid === '26/01640/FUL')
    expect(record).toBeTruthy()
    const cleaned = mapPlanItRecord(record!)
    expect(cleaned?.columns['Application Reference']).toBe('26/01640/FUL')
    expect(cleaned?.columns['Local Authority']).toBe('Scottish Borders')
    expect(cleaned?.columns.County).toBe('Scottish Borders')
    expect(cleaned?.columns.Region).toBe('Scotland')
    expect(cleaned?.columns['Project Category']).toBe('HOUSING UNITS')
    expect(cleaned?.columns['£m Value From']).toBe('0.180')
    expect(cleaned?.columns['£m Value To']).toBe('0.280')
    expect(cleaned?.columns['Architect Agent Email']).toBe('')
    expect(cleaned?.columns['Client Applicant Phone']).toBe('')
    for (const column of MASTER_COLUMNS) expect(cleaned?.columns).toHaveProperty(column)
  })

  it('turns the 29-30 Oct sample into fewer genuine schemes', () => {
    const result = transformRecords(fixture)
    expect(result.fetched).toBe(464)
    expect(result.rows.length).toBeGreaterThan(80)
    expect(result.rows.length).toBeLessThan(300)
    expect(result.filteredOut + result.rows.length + result.errors).toBe(464)
    expect(result.rows.some((row) => row['Application Reference'] === '26/02221/TCA')).toBe(false)
    expect(result.rows.some((row) => row['Application Reference'] === '26/01640/FUL')).toBe(true)
  })
})
