import { readFileSync } from 'node:fs'
import { MASTER_COLUMNS } from '@planningpal/shared'
import { describe, expect, it } from 'vitest'
import { idoxDetailsUrl, parseIdoxDetailsHtml } from './enrichIdox.ts'
import { rejectionReason } from './filter.ts'
import { createHybridPlanningSource, mapLondonDatahubHit } from './londonDatahub.ts'
import { mapPlanItRecord } from './map.ts'
import { createPlanItSource, isPlanItOvernightWindow, parseRetryAfterMs, planItUrl, resetPlanItPacing } from './planit.ts'
import { transformRecords } from './transform.ts'
import type { PlanItRecord } from './types.ts'
import { splitPostcode } from './clean.ts'

const fixture = JSON.parse(readFileSync(new URL('../fixtures/last24h.json', import.meta.url), 'utf8')) as PlanItRecord[]

describe('planit mapping and filters', () => {
  it('splits a UK postcode and its area', () => {
    expect(splitPostcode('78A Osborne Road Forest Gate London E7 0PH')).toEqual({ postcode: 'E7 0PH', area: 'E7' })
  })

  it('builds the PlanIt URL with index pagination and compression', () => {
    const url = new URL(planItUrl({ recentDays: 3, pageSize: 300, authority: 'Camden' }, 300))
    expect(url.searchParams.get('recent')).toBe('3')
    expect(url.searchParams.get('pg_sz')).toBe('300')
    expect(url.searchParams.get('index')).toBe('300')
    expect(url.searchParams.get('auth')).toBe('Camden')
    expect(url.searchParams.get('compress')).toBe('on')
  })

  it('starts a PlanIt page at FetchQuery.index', async () => {
    resetPlanItPacing()
    const urls: string[] = []
    const source = createPlanItSource({
      minIntervalMs: 0,
      maxAttempts: 1,
      fetchImpl: (async (input: RequestInfo | URL) => {
        urls.push(String(input))
        return new Response(JSON.stringify({ records: [{ uid: '1' }], total: 900, from: 600 }), { status: 200, headers: { 'content-type': 'application/json' } })
      }) as typeof fetch,
    })
    const pages = []
    for await (const page of source.fetchPages({ authority: 'Camden', from: '2026-10-30', index: 600, maxPages: 1, pageSize: 300 })) {
      pages.push(page)
    }
    const params = new URL(urls[0] ?? 'https://example.invalid').searchParams
    expect(params.get('index')).toBe('600')
    expect(params.get('start_date')).toBe('2026-10-30')
    expect(params.get('auth')).toBe('Camden')
    expect(pages[0]?.from).toBe(600)
  })

  it('parses Retry-After header values and checks overnight window', () => {
    expect(parseRetryAfterMs('45', 10_000, 65_000)).toBe(45_000)
    expect(parseRetryAfterMs('120', 10_000, 60_000)).toBe(60_000)
    expect(parseRetryAfterMs(null, 15_000, 60_000)).toBe(15_000)
    expect(isPlanItOvernightWindow(new Date('2026-01-15T22:00:00Z'))).toBe(true)
    expect(isPlanItOvernightWindow(new Date('2026-01-15T03:00:00Z'))).toBe(true)
    expect(isPlanItOvernightWindow(new Date('2026-01-15T12:00:00Z'))).toBe(false)
  })

  it('maps GLA London Datahub hits and falls back automatically on PlanIt 429', async () => {
    resetPlanItPacing()
    const mapped = mapLondonDatahubHit({
      lpa_name: 'London Borough of Camden',
      lpa_app_no: '2026/4999/P',
      description: 'Erection of 8 residential dwellings with associated landscaping',
      status: 'Granted',
      valid_date: '30/10/2026',
      postcode: 'NW1 8NH',
      site_number: '12',
      street_name: 'chalk farm road',
      locality: 'London',
      centroid: { lat: 51.541, lon: -0.146 },
      application_details: {
        lead_developer_company_name: 'Camden Living Ltd',
        agent_company: 'Studio North Architects',
        agent_name: 'Sarah Jenkins',
      },
    })
    expect(mapped?.area_name).toBe('Camden')
    expect(mapped?.uid).toBe('2026/4999/P')
    const cleaned = mapPlanItRecord(mapped!)
    expect(cleaned?.columns['Local Authority']).toBe('Camden')
    expect(cleaned?.columns['Client Applicant']).toBe('Camden Living Ltd')
    expect(cleaned?.columns['Architect Agent']).toBe('Studio North Architects')

    const hybrid = createHybridPlanningSource({
      minIntervalMs: 0,
      maxRetryWaitMs: 1,
      fetchImpl: (async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('planit.org.uk')) {
          return new Response('Rate limited', { status: 429, headers: { 'retry-after': '1' } })
        }
        return new Response(
          JSON.stringify({
            hits: {
              total: { value: 1 },
              hits: [{
                _source: {
                  lpa_name: 'Islington',
                  lpa_app_no: 'P2026/3001/FUL',
                  description: 'Construction of 4 townhouses',
                  status: 'Approved',
                  valid_date: '30/10/2026',
                  postcode: 'N1 2JX',
                },
              }],
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        )
      }) as typeof fetch,
    })

    const pages = []
    for await (const page of hybrid.fetchPages({ recentDays: 3, maxPages: 1 })) {
      pages.push(page)
    }
    expect(pages).toHaveLength(1)
    expect(pages[0]?.records[0]?.uid).toBe('P2026/3001/FUL')
  })

  it('extracts applicant and architect details from Idox HTML tables', () => {
    const detailsUrl = idoxDetailsUrl('https://pa.newham.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=TN6TTUJYHLL00')
    expect(detailsUrl).toContain('activeTab=details')
    const contacts = parseIdoxDetailsHtml(`
      <table>
        <tr><th>Applicant Name</th><td>Mr David Vance</td></tr>
        <tr><th>Applicant Company Name</th><td>Vance Developments Ltd</td></tr>
        <tr><th>Agent Name</th><td>Elena Rostova</td></tr>
        <tr><th>Agent Company Name</th><td>Rostova Architecture Studio</td></tr>
        <tr><th>Agent Address</th><td>14 Clerkenwell Green, London EC1R 0DP</td></tr>
        <tr><th>Agent Email</th><td>elena@rostova-arch.co.uk</td></tr>
      </table>
    `)
    expect(contacts.applicantName).toBe('Mr David Vance')
    expect(contacts.applicantCompany).toBe('Vance Developments Ltd')
    expect(contacts.agentName).toBe('Elena Rostova')
    expect(contacts.agentCompany).toBe('Rostova Architecture Studio')
    expect(contacts.agentEmail).toBe('elena@rostova-arch.co.uk')
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
