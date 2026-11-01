import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../app.ts'
import { db } from '../db/client.ts'
import { runMigrations } from '../db/migrate.ts'
import { activities, auditLog, campaigns, crmLeads, inboxConversations, inboxMessages, organisations, planningApplications, savedSchemes, sendingDomains, teamMembers } from '../db/schema.ts'
import { createActor } from './actors.ts'

let app: FastifyInstance
let tenantA = ''
let tenantB = ''
let campaignB = ''
let leadB = ''
let domainB = ''
let conversationB = ''
let teamB = ''
let savedRef = ''
let memberUserId = ''
let ownerA = ''
let viewerA = ''
let memberA = ''
let adminA = ''
let superA = ''

beforeAll(async () => {
  await runMigrations()
  app = buildApp()
  await app.ready()
  const [first] = await db.insert(organisations).values({ companyName: 'Tenant One', slug: 'tenant-one' }).returning()
  const [second] = await db.insert(organisations).values({ companyName: 'Tenant Two', slug: 'tenant-two' }).returning()
  tenantA = first!.id
  tenantB = second!.id
  const [application] = await db
    .insert(planningApplications)
    .values({
      applicationRef: `ISO-${randomUUID()}`,
      compositeHash: `iso-${randomUUID()}`,
      heading: 'Other tenant scheme',
      localAuthority: 'Other',
      sourceRecord: { Heading: 'Other tenant scheme' },
      sourceIndex: 9001,
    })
    .returning()
  const [lead] = await db
    .insert(crmLeads)
    .values({ organisationId: tenantB, applicationId: application!.id, stage: 'STAGE_1_COLD', assigneeName: 'Other' })
    .returning()
  const [campaign] = await db.insert(campaigns).values({ organisationId: tenantB, name: 'Other campaign', status: 'live' }).returning()
  leadB = lead!.id
  campaignB = campaign!.id
  savedRef = application!.applicationRef
  const [domain] = await db.insert(sendingDomains).values({ organisationId: tenantB, name: 'other.example' }).returning()
  domainB = domain!.id
  const [conversation] = await db
    .insert(inboxConversations)
    .values({ organisationId: tenantB, crmLeadId: lead!.id, subject: 'Private thread', preview: 'secret', unread: true, timeLabel: '1m' })
    .returning()
  conversationB = conversation!.id
  await db.insert(inboxMessages).values({
    conversationId: conversation!.id,
    workspaceId: tenantB,
    direction: 'inbound',
    senderName: 'Other',
    body: 'Tenant two only',
    shared: false,
  })
  const owner = await createActor({ email: 'iso-owner@tenant-one.example', name: 'Owner A', organisationId: tenantA, orgRole: 'owner' })
  const admin = await createActor({ email: 'iso-admin@tenant-one.example', name: 'Admin A', organisationId: tenantA, orgRole: 'admin' })
  const member = await createActor({ email: 'iso-member@tenant-one.example', name: 'Member A', organisationId: tenantA, orgRole: 'member' })
  const viewer = await createActor({ email: 'iso-viewer@tenant-one.example', name: 'Viewer A', organisationId: tenantA, orgRole: 'viewer' })
  const staff = await createActor({ email: 'iso-staff@hitcaliber.example', name: 'Staff', organisationId: null, orgRole: 'member', platformRole: 'super_admin' })
  const other = await createActor({ email: 'iso-owner@tenant-two.example', name: 'Owner B', organisationId: tenantB, orgRole: 'owner' })
  ownerA = owner.cookie
  adminA = admin.cookie
  memberA = member.cookie
  viewerA = viewer.cookie
  superA = staff.cookie
  memberUserId = member.user.id
  const [seat] = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.userId, other.user.id))
    .limit(1)
  teamB = seat!.id
  await db.insert(savedSchemes).values({ organisationId: tenantB, userId: other.user.id, applicationId: application!.id })
})

afterAll(async () => {
  await app.close()
})

describe('tenant isolation', () => {
  it('returns 404 when tenant 1 swaps ids from tenant 2', async () => {
    const headers = { cookie: ownerA }
    const campaign = await app.inject({ method: 'PATCH', url: `/api/v1/campaigns/${campaignB}`, headers, payload: { name: 'Stolen' } })
    expect(campaign.statusCode).toBe(404)
    const lead = await app.inject({ method: 'PATCH', url: `/api/v1/crm/leads/${leadB}/stage`, headers, payload: { stage: 'STAGE_3_INTENT' } })
    expect(lead.statusCode).toBe(404)
    const archive = await app.inject({ method: 'POST', url: `/api/v1/crm/leads/${leadB}/archive`, headers, payload: { archived: true } })
    expect(archive.statusCode).toBe(404)
    const workspace = await app.inject({ method: 'GET', url: `/api/v1/workspaces/${tenantB}`, headers })
    expect(workspace.statusCode).toBe(404)
    const removed = await app.inject({ method: 'DELETE', url: `/api/v1/workspaces/${tenantB}`, headers })
    expect(removed.statusCode).toBe(404)
    const missing = await app.inject({ method: 'GET', url: '/api/v1/workspaces/not-a-workspace', headers: { cookie: superA } })
    expect(missing.statusCode).toBe(404)
    const pause = await app.inject({ method: 'POST', url: `/api/v1/campaigns/${campaignB}/pause`, headers })
    expect(pause.statusCode).toBe(404)
    const leads = await app.inject({
      method: 'POST',
      url: `/api/v1/campaigns/${campaignB}/leads`,
      headers,
      payload: { leads: [{ email: 'swap@example.com' }] },
    })
    expect(leads.statusCode).toBe(404)
    const domain = await app.inject({ method: 'DELETE', url: `/api/v1/sending-domains/${domainB}`, headers })
    expect(domain.statusCode).toBe(404)
    const reply = await app.inject({
      method: 'POST',
      url: `/api/v1/inbox/conversations/${conversationB}/reply`,
      headers,
      payload: { body: 'hello' },
    })
    expect(reply.statusCode).toBe(404)
    const seat = await app.inject({
      method: 'PATCH',
      url: `/api/v1/team/${teamB}`,
      headers,
      payload: { role: 'Member' },
    })
    expect(seat.statusCode).toBe(404)
    const inbox = await app.inject({ method: 'GET', url: '/api/v1/inbox/conversations', headers })
    expect(inbox.json().data.map((item: { subject: string }) => item.subject)).not.toContain('Private thread')
    await app.inject({ method: 'DELETE', url: `/api/v1/saved-schemes/${encodeURIComponent(savedRef)}`, headers })
    const stillSaved = await db.select().from(savedSchemes).where(eq(savedSchemes.organisationId, tenantB))
    expect(stillSaved).toHaveLength(1)
    const [campaignRow] = await db.select().from(campaigns).where(eq(campaigns.id, campaignB))
    expect(campaignRow?.name).toBe('Other campaign')
    const [domainRow] = await db.select().from(sendingDomains).where(eq(sendingDomains.id, domainB))
    expect(domainRow?.name).toBe('other.example')
  })

  it('rejects viewer writes and member admin actions', async () => {
    const viewerWrite = await app.inject({
      method: 'POST',
      url: '/api/v1/campaigns',
      headers: { cookie: viewerA },
      payload: { name: 'Nope', region: 'London' },
    })
    expect(viewerWrite.statusCode).toBe(403)
    const viewerCrm = await app.inject({
      method: 'PATCH',
      url: `/api/v1/crm/leads/${leadB}/stage`,
      headers: { cookie: viewerA },
      payload: { stage: 'STAGE_3_INTENT' },
    })
    expect(viewerCrm.statusCode).toBe(403)
    const viewerSave = await app.inject({
      method: 'POST',
      url: '/api/v1/saved-schemes',
      headers: { cookie: viewerA },
      payload: { applicationRef: savedRef },
    })
    expect(viewerSave.statusCode).toBe(403)
    const memberAdmin = await app.inject({
      method: 'POST',
      url: '/api/v1/team/invites',
      headers: { cookie: memberA },
      payload: { email: 'new@tenant-one.example', role: 'Member' },
    })
    expect(memberAdmin.statusCode).toBe(403)
    const memberSettings = await app.inject({
      method: 'PATCH',
      url: '/api/v1/workspace',
      headers: { cookie: memberA },
      payload: { radius: 10 },
    })
    expect(memberSettings.statusCode).toBe(403)
    const memberBilling = await app.inject({ method: 'DELETE', url: `/api/v1/workspaces/${tenantA}`, headers: { cookie: memberA } })
    expect(memberBilling.statusCode).toBe(403)
    const memberRole = await app.inject({
      method: 'POST',
      url: '/api/v1/roles',
      headers: { cookie: memberA },
      payload: { name: 'Closer', permissions: ['crm.read'] },
    })
    expect(memberRole.statusCode).toBe(403)
  })

  it('stops self-promotion and keeps the last owner', async () => {
    const team = await app.inject({ method: 'GET', url: '/api/v1/team', headers: { cookie: ownerA } })
    const self = team.json().members.find((item: { email: string }) => item.email === 'iso-owner@tenant-one.example')
    const own = await app.inject({
      method: 'PATCH',
      url: `/api/v1/team/${self.id}`,
      headers: { cookie: ownerA },
      payload: { role: 'Admin' },
    })
    expect(own.statusCode).toBe(403)
    const promoted = await app.inject({
      method: 'PATCH',
      url: `/api/v1/team/${self.id}`,
      headers: { cookie: adminA },
      payload: { role: 'Owner' },
    })
    expect(promoted.statusCode).toBe(403)
    const removed = await app.inject({ method: 'DELETE', url: `/api/v1/team/${self.id}`, headers: { cookie: ownerA } })
    expect(removed.statusCode).toBe(403)
    expect(removed.json().error).toBe('The last owner cannot be removed')
  })

  it('hides a private note from other members of the same workspace', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/crm/activities',
      headers: { cookie: memberA },
      payload: { type: 'note', title: 'Private', body: 'Only the author' },
    })
    expect(created.statusCode).toBe(201)
    const noteId = created.json().id as string
    const ownerView = await app.inject({ method: 'GET', url: '/api/v1/crm/activities', headers: { cookie: ownerA } })
    expect(ownerView.json().data.map((item: { id: string }) => item.id)).not.toContain(noteId)
    const authorView = await app.inject({ method: 'GET', url: '/api/v1/crm/activities', headers: { cookie: memberA } })
    expect(authorView.json().data.map((item: { id: string }) => item.id)).toContain(noteId)
    const stolen = await app.inject({
      method: 'PATCH',
      url: `/api/v1/crm/activities/${noteId}`,
      headers: { cookie: ownerA },
      payload: { completed: true },
    })
    expect(stolen.statusCode).toBe(404)
    const [row] = await db.select().from(activities).where(eq(activities.id, noteId))
    expect(row?.userId).toBe(memberUserId)
    expect(row?.shared).toBe(false)
  })

  it('logs super admin access and does not open another tenant without that header', async () => {
    const quiet = await app.inject({ method: 'GET', url: '/api/v1/campaigns', headers: { cookie: superA } })
    expect(quiet.statusCode).toBe(404)
    const opened = await app.inject({
      method: 'GET',
      url: '/api/v1/campaigns',
      headers: { cookie: superA, 'x-workspace-id': tenantB },
    })
    expect(opened.statusCode).toBe(200)
    expect(opened.json().data.map((item: { id: string }) => item.id)).toContain(campaignB)
    const rows = await db.select().from(auditLog).where(eq(auditLog.workspaceId, tenantB))
    expect(rows.some((row) => row.action === 'staff.workspace.access')).toBe(true)
    const quietMessages = await db.select().from(inboxMessages).where(eq(inboxMessages.conversationId, conversationB))
    expect(quietMessages.every((row) => row.body !== 'hello')).toBe(true)
  })
})
