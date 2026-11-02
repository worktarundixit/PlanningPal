import { createHmac } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { MASTER_COLUMNS } from '@planningpal/shared'
import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../app.ts'
import { sqlClient, db } from '../db/client.ts'
import { runMigrations } from '../db/migrate.ts'
import {
  campaigns,
  councils,
  crmLeads,
  decisionMakers,
  inboxConversations,
  inboxMessages,
  organisations,
  planningApplications,
} from '../db/schema.ts'
import { createActor } from './actors.ts'

let app: FastifyInstance
let cookie = ''
let applicationRef = ''
let leadId = ''
let campaignId = ''
let conversationId = ''

beforeAll(async () => {
  await runMigrations()
  await sqlClient.unsafe(`
    TRUNCATE TABLE
      mail_log, invitations,
      telemetry_events, invoices, meetings, persona_templates, intent_events,
      inbox_messages, inbox_conversations, sending_domains, campaigns, activities,
      crm_leads, saved_schemes, decision_makers, planning_applications, councils,
      custom_roles, team_members, users,
      organisations
    RESTART IDENTITY CASCADE
  `)

  const [client] = await db
    .insert(organisations)
    .values({ companyName: 'Micraft Design Ltd', tier: 'CATEGORY_2' })
    .returning()
  const actor = await createActor({
    email: 'james@micraftdesign.co.uk',
    name: 'James Wilkins',
    organisationId: client!.id,
    orgRole: 'owner',
    jobTitle: 'Account owner',
  })
  cookie = actor.cookie
  const [council] = await db
    .insert(councils)
    .values({ code: 'CROYDON', name: 'Croydon Council', portalType: 'IDOX', baseUrl: 'https://example.test', county: 'London', region: 'London' })
    .returning()

  const rows = await db
    .insert(planningApplications)
    .values([
      {
        councilId: council!.id,
        applicationRef: '26/02630/FUL',
        compositeHash: 'hash-a',
        heading: 'Dwelling',
        proposal: 'Erection of a single-storey rear extension',
        valueFromM: '0.250',
        valueToM: '0.450',
        siteRawAddress: '1041 London Road',
        siteAddress: '1041 London Road',
        localAuthority: 'Croydon Council',
        county: 'London',
        region: 'London',
        projectStage: 'DETAILED PLANS APPROVED',
        status: 'Approved',
        primaryCategory: 'NEW BUILD',
        propType: 'Dwelling',
        publicationDate: 'Mon 14 Sep 2026',
        portalUrl: 'https://example.test/planning/26/02630/FUL',
        architectAgent: 'MR Kashif Syed',
        architectAgentContact: 'MR Kashif Syed',
        architectAgentEmail: 'k.syed@arista-architecture.com',
        architectAgentPhone: '07710 183 612',
        sourceIndex: 0,
        sourceRecord: {
          Heading: 'Dwelling',
          '£m Value From': '0.25',
          '£m Value To': '0.45',
          Proposal: 'Erection of a single-storey rear extension',
          'Site Raw Address': '1041 London Road',
          'Client Applicant Contact': '',
          'Client Applicant': 'MR ARSHAD GANI',
          'Client Applicant Raw Address': '',
          'Client Applicant Phone': '',
          'Architect Agent Contact': 'MR Kashif Syed',
          'Architect Agent': 'MR Kashif Syed',
          'Architect Agent Raw Address': '157 WINTERBOURNE ROAD',
          'Architect Agent Phone': '07710 183 612',
          'Architect Agent Email': 'k.syed@arista-architecture.com',
          'Mail Client Contact': '',
          'Mail Client Name': '',
          'Client Applicant Address Line 1': '',
          'Client Applicant Address Line 2': '',
          'Client Applicant Address Line 3': '',
          'Client Applicant Address Line 4': '',
          'Client Applicant Postcode': '',
          'Client Applicant Postcode Area': '',
          'Mail Architect Agent Contact': '',
          'Mail Architect Agent Name': '',
          'Architect Agent Address Line 1': '',
          'Architect Agent Address Line 2': '',
          'Architect Agent Address Line 3': '',
          'Architect Agent Address Line 4': '',
          'Architect Agent Postcode': '',
          'Architect Agent Postcode Area': '',
          'Site Address': '1041 London Road',
          'Site Address Postcode Area': 'CR7',
          'Prop Type': 'Dwelling',
          '£m Est Prop Val From': '0.25',
          '£m Est Prop Val To': '0.45',
          'URL Link': 'https://example.test/planning/26/02630/FUL',
          'Local Authority': 'Croydon Council',
          'Application Reference': '26/02630/FUL',
          County: 'London',
          Region: 'London',
          'Project Stage': 'DETAILED PLANS APPROVED',
          'Publication Date': 'Mon 14 Sep 2026',
          'Project ID': '11413539',
          'Project Category': 'NEW BUILD',
        },
      },
      {
        councilId: council!.id,
        applicationRef: '26/00002/FUL',
        compositeHash: 'hash-b',
        heading: 'Flats',
        proposal: 'Construction of flats',
        valueFromM: '2.000',
        valueToM: '3.500',
        siteRawAddress: '1 High Street',
        siteAddress: '1 High Street',
        localAuthority: 'Croydon Council',
        county: 'Surrey',
        region: 'South East',
        projectStage: 'DETAILED PLANS APPROVED',
        status: 'Approved',
        primaryCategory: 'HOUSING UNITS',
        propType: 'Flats',
        portalUrl: 'https://example.test/planning/26/00002/FUL',
        architectAgentEmail: '',
        architectAgentPhone: '',
        sourceIndex: 1,
        sourceRecord: {
          Heading: 'Flats',
          '£m Value From': '2.00',
          '£m Value To': '3.50',
          Proposal: 'Construction of flats',
          'Application Reference': '26/00002/FUL',
          'Project Category': 'HOUSING UNITS',
          County: 'Surrey',
          Region: 'South East',
          'Local Authority': 'Croydon Council',
          'Project Stage': 'DETAILED PLANS APPROVED',
          'URL Link': 'https://example.test/planning/26/00002/FUL',
          'Site Address': '1 High Street',
          'Prop Type': 'Flats',
        },
      },
    ])
    .returning()

  applicationRef = rows[0]!.applicationRef
  await db.insert(decisionMakers).values({
    applicationId: rows[0]!.id,
    role: 'ARCHITECT',
    firmName: 'MR Kashif Syed',
    contactName: 'MR Kashif Syed',
    email: 'k.smithson@naturalbuildingstudio.co.uk',
    phone: '07710 183 612',
    confidenceLevel: 'VERIFIED_DIRECT',
  })
  const [lead] = await db
    .insert(crmLeads)
    .values({ organisationId: client!.id, applicationId: rows[0]!.id, stage: 'STAGE_1_COLD', openCount: 1, assigneeName: 'Emily Rhodes' })
    .returning()
  leadId = lead!.id
  const [campaign] = await db
    .insert(campaigns)
    .values({ organisationId: client!.id, name: 'Micraft Design · RIBA 1–2', status: 'live', region: 'London', contacts: 10, sent: 4, openRate: '50%', replyRate: '10%', meetings: 1 })
    .returning()
  campaignId = campaign!.id
  const [conversation] = await db
    .insert(inboxConversations)
    .values({ organisationId: client!.id, crmLeadId: lead!.id, subject: 'Re: Dwelling', preview: 'Hello', unread: true, timeLabel: '12m' })
    .returning()
  conversationId = conversation!.id
  await db.insert(inboxMessages).values({
    conversationId: conversation!.id,
    direction: 'inbound',
    senderName: 'MR Kashif Syed',
    body: 'Thanks for the introduction.',
    deliveryStatus: 'delivered',
    timeLabel: 'Today',
  })

  app = buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

describe('planningpal api', () => {
  it('describes the 44-column export', () => {
    expect(MASTER_COLUMNS).toHaveLength(44)
  })

  it('rejects missing tokens when auth is strict', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/planning/leads' })
    expect(response.statusCode).toBe(401)
  })

  it('serves health without auth', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/health' })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ ok: true })
    const alias = await app.inject({ method: 'GET', url: '/api/health' })
    expect(alias.statusCode).toBe(200)
    expect(alias.json()).toMatchObject({ ok: true, service: 'planningpal-api' })
  })

  it('lists and filters planning leads', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/planning/leads?min_val=1&county=Surrey',
      headers: { cookie },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.total).toBe(1)
    expect(body.data[0].id).toBe('26/00002/FUL')
    expect(body.data[0].category).toBe('HOUSING UNITS')
  })

  it('returns a dossier with the source record', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/planning/leads/${encodeURIComponent(applicationRef)}`,
      headers: { cookie },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.scheme.raw['Application Reference']).toBe(applicationRef)
    expect(body.scheme.raw.Heading).toBe('Dwelling')
    expect(body.contacts[0].email).toBe('k.smithson@naturalbuildingstudio.co.uk')
    expect(body.summary.columnCount).toBe(44)
  })

  it('saves and unsaves a scheme', async () => {
    const headers = { cookie }
    const save = await app.inject({ method: 'POST', url: '/api/v1/saved-schemes', headers, payload: { applicationRef } })
    expect(save.statusCode).toBe(200)
    const listed = await app.inject({ method: 'GET', url: '/api/v1/saved-schemes', headers })
    expect(listed.json().ids).toContain(applicationRef)
    const removed = await app.inject({ method: 'DELETE', url: `/api/v1/saved-schemes/${encodeURIComponent(applicationRef)}`, headers })
    expect(removed.statusCode).toBe(200)
    const after = await app.inject({ method: 'GET', url: '/api/v1/saved-schemes', headers })
    expect(after.json().ids).not.toContain(applicationRef)
  })

  it('exports a 44-column csv header', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/planning/leads/export',
      headers: { cookie },
      payload: { format: 'csv', filter_params: { ids: [applicationRef] } },
    })
    expect(response.statusCode).toBe(200)
    const header = response.body.split('\n')[0]
    for (const column of MASTER_COLUMNS) expect(header).toContain(`"${column}"`)
  })

  it('moves a CRM card and stores a note', async () => {
    const headers = { cookie }
    const moved = await app.inject({
      method: 'PATCH',
      url: `/api/v1/crm/leads/${leadId}/stage`,
      headers,
      payload: { stage: 'STAGE_3_INTENT', notes: 'Opened the deck' },
    })
    expect(moved.statusCode).toBe(200)
    expect(moved.json().card.stageId).toBe('STAGE_3_INTENT')

    const note = await app.inject({
      method: 'POST',
      url: '/api/v1/crm/activities',
      headers,
      payload: { type: 'note', crmLeadId: leadId, body: 'Call back Thursday' },
    })
    expect(note.statusCode).toBe(201)
    const activities = await app.inject({ method: 'GET', url: '/api/v1/crm/activities?type=note', headers })
    expect(activities.json().data.some((item: { body: string }) => item.body === 'Call back Thursday')).toBe(true)

    const archived = await app.inject({
      method: 'POST',
      url: `/api/v1/crm/leads/${leadId}/archive`,
      headers,
      payload: { archived: true },
    })
    expect(archived.json().archived).toBe(true)
  })

  it('creates and pauses a campaign', async () => {
    const headers = { cookie }
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/campaigns',
      headers,
      payload: { name: 'Kent groundworks', region: 'South East' },
    })
    expect(created.statusCode).toBe(201)
    expect(created.json().status).toBe('draft')
    const paused = await app.inject({ method: 'POST', url: `/api/v1/campaigns/${campaignId}/pause`, headers })
    expect(paused.statusCode).toBe(200)
    expect(paused.json().status).toBe('paused')
    const resumed = await app.inject({ method: 'POST', url: `/api/v1/campaigns/${campaignId}/resume`, headers })
    expect(resumed.json().status).toBe('live')
  })

  it('updates the profile', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/me',
      headers: { cookie },
      payload: { name: 'James Wilkins', role: 'Commercial director', company: 'Micraft Design Ltd', email: 'james@micraftdesign.co.uk' },
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().role).toBe('Commercial director')
  })

  it('marks inbox threads read and stores a stubbed reply', async () => {
    const headers = { cookie }
    const read = await app.inject({ method: 'POST', url: `/api/v1/inbox/conversations/${conversationId}/read`, headers })
    expect(read.json().unread).toBe(false)
    const reply = await app.inject({
      method: 'POST',
      url: `/api/v1/inbox/conversations/${conversationId}/reply`,
      headers,
      payload: { body: 'Happy to send the deck.' },
    })
    expect(reply.statusCode).toBe(201)
    expect(reply.json().deliveryStatus).toBe('stubbed')
    const inbox = await app.inject({ method: 'GET', url: '/api/v1/inbox/conversations', headers })
    const thread = inbox.json().data.find((item: { id: string }) => item.id === conversationId)
    expect(thread.messages.at(-1).body).toBe('Happy to send the deck.')
  })

  it('accepts a signed telemetry event once', async () => {
    await db.update(crmLeads).set({ stage: 'STAGE_1_COLD', openCount: 1, deckDownloaded: false }).where(eq(crmLeads.id, leadId))
    const payload = {
      event_id: 'evt_test_1',
      event_type: 'email_opened',
      timestamp: '2026-10-31T10:14:22Z',
      data: {
        campaign_id: 'cmp_groundworks_surrey',
        lead_email: 'k.smithson@naturalbuildingstudio.co.uk',
        application_ref: applicationRef,
        open_count: 3,
      },
    }
    const raw = JSON.stringify(payload)
    const signature = createHmac('sha256', 'test-secret').update(raw).digest('hex')
    const headers = { 'content-type': 'application/json', 'x-aec-signature': signature }
    const first = await app.inject({ method: 'POST', url: '/api/v1/telemetry/event', headers, payload: raw })
    expect(first.statusCode).toBe(200)
    expect(first.json()).toMatchObject({ ok: true, duplicate: false, promoted: true })
    const second = await app.inject({ method: 'POST', url: '/api/v1/telemetry/event', headers, payload: raw })
    expect(second.json().duplicate).toBe(true)
  })
})
