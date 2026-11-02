import { readFileSync } from 'node:fs'
import { extractEmails, extractRecordContacts, extractUkPhones, formatUkPhone, transformRecords, type PlanItRecord } from '@planningpal/ingest'
import { describe, expect, it } from 'vitest'
import { enrichSourceRecord, enrichSourceRecords, parsePortalHtmlContacts } from './enrich.ts'

const fixture = JSON.parse(readFileSync(new URL('../../../../packages/ingest/fixtures/last24h.json', import.meta.url), 'utf8')) as PlanItRecord[]

describe('multi-source contact & phone extraction', () => {
  it('normalizes and extracts UK phone numbers across mobile, London, and regional formats', () => {
    expect(formatUkPhone('07960071377')).toBe('07960 071 377')
    expect(formatUkPhone('+44 (0)20 8665 1586')).toBe('020 8665 1586')
    expect(formatUkPhone('01709254096')).toBe('01709 254096')
    expect(formatUkPhone('0121 456 7890 ext 22')).toBe('0121 456 7890')
    expect(formatUkPhone('2026-10-30')).toBe('')

    const text = 'Agent: Savills Tel: +44 (0)20 7499 8644 or mobile 07710 183 612 (Ref 26/02630/FUL, 51.54886509768261)'
    expect(extractUkPhones(text)).toEqual(['020 7499 8644', '07710 183 612'])
    expect(extractEmails('Contact k.syed@arista-architecture.com or noreply@council.gov.uk')).toEqual(['k.syed@arista-architecture.com'])
  })

  it('extracts agent_tel, Attn/Per prefixes, and leading firm names from PlanIt records', () => {
    const wokingham = fixture.find((r) => r.uid === '262540')!
    const extractedTel = extractRecordContacts(wokingham)
    expect(extractedTel.agentPhone).toBe('07960 071 377')

    const city = fixture.find((r) => r.other_fields?.agent_company === 'Newmark LLP')!
    const extractedCity = extractRecordContacts(city)
    expect(extractedCity.agentName).toBe('Mr Toby Smith')
    expect(extractedCity.agentCompany).toBe('Newmark LLP')

    const eastLothian = fixture.find((r) => String(r.other_fields?.agent_address || '').startsWith('Per Alex Mitchell'))!
    const extractedPer = extractRecordContacts(eastLothian)
    expect(extractedPer.agentName).toBe('Alex Mitchell')
  })

  it('parses Idox details and contacts HTML tables and tel/mailto links', () => {
    const html = `
      <table>
        <tr><th>Applicant Name</th><td>Mr Arshad Gani</td></tr>
        <tr><th>Agent Name</th><td>Mr Kashif Syed</td></tr>
        <tr><th>Agent Company Name</th><td>Arista Architecture Ltd</td></tr>
        <tr><th>Agent Address</th><td>157 Winterbourne Road Thornton Heath CR7 7QZ</td></tr>
        <tr><th>Agent Phone Number</th><td>07710 183 612</td></tr>
        <tr><th>Agent Email</th><td><a href="mailto:k.syed@arista-architecture.com">k.syed@arista-architecture.com</a></td></tr>
      </table>
    `
    const parsed = parsePortalHtmlContacts(html)
    expect(parsed).toMatchObject({
      applicant: 'Mr Arshad Gani',
      agentName: 'Mr Kashif Syed',
      agentCompany: 'Arista Architecture Ltd',
      agentAddress: '157 Winterbourne Road Thornton Heath CR7 7QZ',
      agentPhone: '07710 183 612',
      agentEmail: 'k.syed@arista-architecture.com',
    })
  })

  it('enriches 100% of transformed PlanIt schemes with valid UK phone numbers, emails, and agent contacts', async () => {
    const transformed = transformRecords(fixture)
    expect(transformed.rows.length).toBeGreaterThan(100)

    const enriched = await enrichSourceRecords(transformed.rows, { allowNetwork: false })
    expect(enriched).toHaveLength(transformed.rows.length)

    for (const row of enriched) {
      expect(row['Architect Agent']).toBeTruthy()
      expect(row['Architect Agent Contact']).toBeTruthy()
      expect(formatUkPhone(row['Architect Agent Phone'] ?? '')).toBeTruthy()
      expect(row['Architect Agent Email']).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    }

    // Check that known practice Savills / Newmark LLP resolved its directory details
    const newmark = enriched.find((r) => r['Architect Agent'] === 'Newmark LLP')
    if (newmark) {
      expect(newmark['Architect Agent Contact']).toBe('Mr Toby Smith')
      expect(newmark['Architect Agent Phone']).toBe('020 7493 3338')
      expect(newmark['Architect Agent Email']).toBe('ukplanning@nmrk.com')
    }

    // Verify single record enrichment by exact reference match from master CSV
    const croydonRef = await enrichSourceRecord(
      {
        'Application Reference': '26/02630/FUL',
        'Local Authority': 'Croydon Council',
      },
      { allowNetwork: false },
    )
    expect(croydonRef['Architect Agent Contact']).toBe('MR Kashif Syed')
    expect(croydonRef['Architect Agent Phone']).toBe('07710 183 612')
    expect(croydonRef['Architect Agent Email']).toBe('k.syed@arista-architecture.com')
  })
})
