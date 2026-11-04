import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../app.ts'
import { db } from '../db/client.ts'
import { runMigrations } from '../db/migrate.ts'
import { campaignProviderSettings, organisations, users } from '../db/schema.ts'
import { loadCampaignEngine } from '../providers/campaign/index.ts'
import { inArray } from 'drizzle-orm'
import { createActor } from './actors.ts'

let app: FastifyInstance
let ownerCookie = ''
let superCookie = ''
let organisationId = ''

beforeAll(async () => {
  await runMigrations()
  await db.delete(users).where(inArray(users.email, ['owner-provider@example.com', 'staff-provider@example.com']))
  app = buildApp()
  await app.ready()
  const [organisation] = await db.insert(organisations).values({ companyName: 'Provider Test Ltd' }).returning()
  organisationId = organisation!.id
  const owner = await createActor({ email: 'owner-provider@example.com', name: 'Owner', organisationId, orgRole: 'owner' })
  const staff = await createActor({
    email: 'staff-provider@example.com',
    name: 'Priya',
    organisationId,
    orgRole: 'owner',
    platformRole: 'super_admin',
  })
  ownerCookie = owner.cookie
  superCookie = staff.cookie
})

afterAll(async () => {
  await app.close()
})

describe('campaign provider', () => {
  it('hides provider settings from a client owner', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/campaign-provider', headers: { cookie: ownerCookie } })
    expect(response.statusCode).toBe(403)
    expect(JSON.stringify(response.json()).toLowerCase()).not.toContain('instantly')
  })

  it('stores an agency key encrypted and returns only a mask', async () => {
    const raw = 'super-secret-agency-key-1234'
    const saved = await app.inject({
      method: 'PUT',
      url: '/api/v1/campaign-provider',
      headers: { cookie: superCookie },
      payload: { apiKey: raw },
    })
    expect(saved.statusCode).toBe(200)
    expect(saved.json().hint).toBe('••••1234')
    expect(JSON.stringify(saved.json())).not.toContain(raw)
    const listed = await app.inject({ method: 'GET', url: '/api/v1/campaign-provider', headers: { cookie: superCookie } })
    expect(listed.json().configured).toBe(true)
    expect(JSON.stringify(listed.json())).not.toContain(raw)
    expect(JSON.stringify(listed.json()).toLowerCase()).not.toContain('instantly')
  })

  it('maps a client workspace and keeps provider ids off the client campaign payload', async () => {
    const mapped = await app.inject({
      method: 'PUT',
      url: '/api/v1/campaign-provider/mappings',
      headers: { cookie: superCookie },
      payload: { organisationId, providerWorkspaceId: 'sandbox-london', trackingDomain: 'track.provider-test.co.uk' },
    })
    expect(mapped.statusCode).toBe(200)
    expect(mapped.json().health).toBe('ok')
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/campaigns',
      headers: { cookie: ownerCookie },
      payload: { name: 'Spring outreach', region: 'London' },
    })
    expect(created.statusCode).toBe(201)
    const body = JSON.stringify(created.json())
    expect(body).not.toContain('providerCampaignId')
    expect(body).not.toContain('sandbox-')
    expect(body.toLowerCase()).not.toContain('instantly')
    const leads = await app.inject({
      method: 'POST',
      url: `/api/v1/campaigns/${created.json().id}/leads`,
      headers: { cookie: ownerCookie },
      payload: { leads: [{ email: 'maya@northbankstudio.co.uk', firstName: 'Maya' }] },
    })
    expect(leads.statusCode).toBe(200)
    expect(leads.json()).toEqual(expect.objectContaining({ added: 1 }))
  })

  it('writes a reply into the client intent feed and rejects a bad token', async () => {
    const denied = await app.inject({
      method: 'POST',
      url: '/api/v1/campaign-events/wrong-token',
      payload: { event_type: 'reply_received', workspace: 'sandbox-london', lead_email: 'maya@northbankstudio.co.uk' },
    })
    expect(denied.statusCode).toBe(401)
    const accepted = await app.inject({
      method: 'POST',
      url: '/api/v1/campaign-events/test-webhook-secret',
      payload: { event_type: 'reply_received', workspace: 'sandbox-london', lead_email: 'maya@northbankstudio.co.uk', campaign_id: 'remote-1' },
    })
    expect(accepted.statusCode).toBe(200)
    const overview = await app.inject({ method: 'GET', url: '/api/v1/overview', headers: { cookie: ownerCookie } })
    const intent = overview.json().intent as { action: string }[]
    expect(intent.some((event) => event.action === 'replied to your campaign')).toBe(true)
    expect(JSON.stringify(overview.json()).toLowerCase()).not.toContain('instantly')
  })

  it('stays in sandbox when no agency key is saved', async () => {
    const previous = process.env.CAMPAIGN_PROVIDER
    delete process.env.CAMPAIGN_PROVIDER
    await db.delete(campaignProviderSettings)
    const engine = await loadCampaignEngine()
    expect(engine.mode).toBe('sandbox')
    if (previous === undefined) delete process.env.CAMPAIGN_PROVIDER
    else process.env.CAMPAIGN_PROVIDER = previous
  })
})
