import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../app.ts'
import { db, sqlClient } from '../db/client.ts'
import { runMigrations } from '../db/migrate.ts'
import { eq } from 'drizzle-orm'
import {
  campaigns,
  crmLeads,
  inboxConversations,
  mailLog,
  organisations,
  planningApplications,
  savedSchemes,
} from '../db/schema.ts'
import { createActor } from './actors.ts'
import type { OrgRole } from '../auth/permissions.ts'

let app: FastifyInstance
const cookies: Record<OrgRole | 'super', string> = {
  owner: '',
  admin: '',
  member: '',
  viewer: '',
  super: '',
}
let orgA = ''
let orgB = ''
let leadA = ''
let leadB = ''
let campaignB = ''
let ref = ''

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
  const [first] = await db.insert(organisations).values({ companyName: 'Org A' }).returning()
  const [second] = await db.insert(organisations).values({ companyName: 'Org B' }).returning()
  orgA = first!.id
  orgB = second!.id
  const [application] = await db
    .insert(planningApplications)
    .values({
      applicationRef: '26/RBAC/FUL',
      compositeHash: 'rbac-hash',
      heading: 'RBAC dwelling',
      localAuthority: 'Org Test',
      sourceRecord: { Heading: 'RBAC dwelling' },
      sourceIndex: 1,
    })
    .returning()
  ref = application!.applicationRef
  const [privateApplication] = await db
    .insert(planningApplications)
    .values({
      applicationRef: '26/ORG-B/FUL',
      compositeHash: 'org-b-hash',
      heading: 'Org B scheme',
      localAuthority: 'Org Test',
      sourceRecord: { Heading: 'Org B scheme' },
      sourceIndex: 2,
    })
    .returning()
  const [cardA] = await db
    .insert(crmLeads)
    .values({ organisationId: orgA, applicationId: application!.id, stage: 'STAGE_1_COLD', assigneeName: 'A' })
    .returning()
  const [cardB] = await db
    .insert(crmLeads)
    .values({ organisationId: orgB, applicationId: application!.id, stage: 'STAGE_2_ENGAGED', assigneeName: 'B' })
    .returning()
  leadA = cardA!.id
  leadB = cardB!.id
  const [hiddenCampaign] = await db
    .insert(campaigns)
    .values({ organisationId: orgB, name: 'Org B only', status: 'live', region: 'London' })
    .returning()
  campaignB = hiddenCampaign!.id
  const ownerB = await createActor({ email: 'owner-b@example.com', name: 'Owner B', organisationId: orgB, orgRole: 'owner' })
  await db.insert(savedSchemes).values({ organisationId: orgB, userId: ownerB.user.id, applicationId: privateApplication!.id })
  await db.insert(inboxConversations).values({
    organisationId: orgB,
    crmLeadId: leadB,
    subject: 'Org B thread',
    preview: 'private',
    unread: true,
    timeLabel: '1m',
  })

  const roles: OrgRole[] = ['owner', 'admin', 'member', 'viewer']
  for (const role of roles) {
    const actor = await createActor({
      email: `${role}@orga.example`,
      name: role,
      organisationId: orgA,
      orgRole: role,
    })
    cookies[role] = actor.cookie
  }
  const superAdmin = await createActor({
    email: 'super@hitcaliber.example',
    name: 'Super',
    organisationId: null,
    orgRole: 'member',
    platformRole: 'super_admin',
  })
  cookies.super = superAdmin.cookie
  app = buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

describe('permission matrix', () => {
  const roles = ['owner', 'admin', 'member', 'viewer', 'super'] as const

  const cases: {
    name: string
    method: 'GET' | 'POST' | 'PATCH'
    url: () => string
    body?: Record<string, unknown> | ((role: string) => Record<string, unknown>)
    ok: number
    allow: readonly string[]
  }[] = [
    { name: 'list planning leads', method: 'GET', url: () => '/api/v1/planning/leads', ok: 200, allow: roles },
    { name: 'save a scheme', method: 'POST', url: () => '/api/v1/saved-schemes', body: () => ({ applicationRef: ref }), ok: 200, allow: ['owner', 'admin', 'member', 'super'] },
    { name: 'move a CRM card', method: 'PATCH', url: () => `/api/v1/crm/leads/${leadA}/stage`, body: { stage: 'STAGE_3_INTENT' }, ok: 200, allow: ['owner', 'admin', 'member', 'super'] },
    {
      name: 'create a campaign',
      method: 'POST',
      url: () => '/api/v1/campaigns',
      body: (role) => ({ name: `Campaign ${role}`, region: 'London' }),
      ok: 201,
      allow: ['owner', 'admin', 'super'],
    },
    { name: 'update workspace settings', method: 'PATCH', url: () => '/api/v1/workspace', body: { radius: 40 }, ok: 200, allow: ['owner', 'admin', 'super'] },
    { name: 'read billing', method: 'GET', url: () => '/api/v1/billing', ok: 200, allow: ['owner', 'super'] },
    {
      name: 'invite a teammate',
      method: 'POST',
      url: () => '/api/v1/team/invites',
      body: (role) => ({ email: `invite-${role}@orga.example`, role: 'Member' }),
      ok: 201,
      allow: ['owner', 'admin', 'super'],
    },
    { name: 'open ingestion admin', method: 'GET', url: () => '/api/v1/ingest/runs', ok: 200, allow: ['super'] },
  ]

  for (const role of roles) {
    for (const entry of cases) {
      const allowed = entry.allow.includes(role)
      it(`${role} ${allowed ? 'can' : 'cannot'} ${entry.name}`, async () => {
        const payload = typeof entry.body === 'function' ? entry.body(role) : entry.body
        const response = await app.inject({
          method: entry.method,
          url: entry.url(),
          headers: { cookie: cookies[role] },
          payload,
        })
        if (response.statusCode !== (allowed ? entry.ok : 403)) {
          throw new Error(`${role} ${entry.name} returned ${response.statusCode}: ${response.body}`)
        }
        expect(response.statusCode).toBe(allowed ? entry.ok : 403)
      })
    }
  }

  it('stops an admin from changing the owner', async () => {
    const team = await app.inject({ method: 'GET', url: '/api/v1/team', headers: { cookie: cookies.admin } })
    const owner = team.json().members.find((member: { role: string }) => member.role === 'Owner')
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/team/${owner.id}`,
      headers: { cookie: cookies.admin },
      payload: { role: 'Member' },
    })
    expect(response.statusCode).toBe(403)
  })
})

describe('organisation isolation', () => {
  it('hides org B CRM, campaigns, inbox, and saved schemes from org A', async () => {
    const headers = { cookie: cookies.owner }
    const kanban = await app.inject({ method: 'GET', url: '/api/v1/crm/kanban', headers })
    const cardIds = kanban.json().cards.map((card: { id: string }) => card.id)
    expect(cardIds).toContain(leadA)
    expect(cardIds).not.toContain(leadB)

    const moved = await app.inject({
      method: 'PATCH',
      url: `/api/v1/crm/leads/${leadB}/stage`,
      headers,
      payload: { stage: 'STAGE_3_INTENT' },
    })
    expect(moved.statusCode).toBe(404)

    const campaignList = await app.inject({ method: 'GET', url: '/api/v1/campaigns', headers })
    expect(campaignList.json().data.map((item: { id: string }) => item.id)).not.toContain(campaignB)

    const saved = await app.inject({ method: 'GET', url: '/api/v1/saved-schemes', headers })
    expect(saved.json().ids).not.toContain('26/ORG-B/FUL')

    const inbox = await app.inject({ method: 'GET', url: '/api/v1/inbox/conversations', headers })
    expect(inbox.json().data.map((item: { subject: string }) => item.subject)).not.toContain('Org B thread')
  })

  it('lets a super admin read another organisation when the header selects it', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/campaigns',
      headers: { cookie: cookies.super, 'x-organisation-id': orgB },
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().data.map((item: { id: string }) => item.id)).toContain(campaignB)
  })
})

describe('lead alerts', () => {
  it('logs a new-lead message when Resend is not configured', async () => {
    const { mailer } = await import('../auth/mailer.ts')
    await mailer.send({ kind: 'lead-alert', to: 'owner@orga.example', subject: '3 new planning leads', text: 'Dwelling' })
    const rows = await db.select().from(mailLog).where(eq(mailLog.recipient, 'owner@orga.example'))
    expect(rows.some((row) => row.kind === 'lead-alert')).toBe(true)
  })
})

describe('auth providers', () => {
  it('offers email, magic link and Google through Supabase', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/auth/providers' })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ email: true, magicLink: true, google: true })
  })
})

describe('row level security', () => {
  it('restricts organisation rows to the signed-in organisation and super admins', async () => {
    const rows = await sqlClient<{ relrowsecurity: boolean; policy: string | null }[]>`
      SELECT c.relrowsecurity,
        (SELECT pol.polname FROM pg_policy pol WHERE pol.polrelid = c.oid AND pol.polname = 'organisations_tenant') AS policy
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = 'organisations'
    `
    expect(rows[0]?.relrowsecurity).toBe(true)
    expect(rows[0]?.policy).toBe('organisations_tenant')
  })
})
