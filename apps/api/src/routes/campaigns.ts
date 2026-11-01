import { asc, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/client.ts'
import { campaigns, organisations, sendingDomains } from '../db/schema.ts'
import { parseBody, requireUser } from '../lib/http.ts'

const campaignBody = z.object({
  name: z.string().min(1),
  region: z.string().min(1).default('London'),
  status: z.enum(['draft', 'live', 'paused']).optional(),
})

function presentCampaign(row: typeof campaigns.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    region: row.region,
    contacts: row.contacts,
    sent: row.sent,
    open: row.openRate,
    reply: row.replyRate,
    meetings: row.meetings,
  }
}

export async function campaignRoutes(app: FastifyInstance) {
  app.get('/api/v1/campaigns', async (request) => {
    const user = requireUser(request)
    const rows = await db.select().from(campaigns).where(eq(campaigns.organisationId, user.organisationId)).orderBy(asc(campaigns.createdAt))
    return { data: rows.map(presentCampaign) }
  })

  app.post('/api/v1/campaigns', async (request, reply) => {
    const user = requireUser(request)
    const body = parseBody(campaignBody, request.body, reply)
    if (!body) return
    const [created] = await db
      .insert(campaigns)
      .values({
        organisationId: user.organisationId,
        name: body.name,
        region: body.region,
        status: body.status ?? 'draft',
        contacts: 0,
        sent: 0,
        openRate: '—',
        replyRate: '—',
        meetings: 0,
      })
      .returning()
    return reply.code(201).send(created ? presentCampaign(created) : { error: 'Could not create campaign' })
  })

  app.patch('/api/v1/campaigns/:id', async (request, reply) => {
    const user = requireUser(request)
    const { id } = request.params as { id: string }
    const body = parseBody(campaignBody.partial(), request.body, reply)
    if (!body) return
    const [updated] = await db
      .update(campaigns)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(campaigns.id, id))
      .returning()
    if (!updated || updated.organisationId !== user.organisationId) return reply.code(404).send({ error: 'Campaign not found' })
    return presentCampaign(updated)
  })

  app.post('/api/v1/campaigns/:id/pause', async (request, reply) => setStatus(request, reply, 'paused'))
  app.post('/api/v1/campaigns/:id/resume', async (request, reply) => setStatus(request, reply, 'live'))

  app.get('/api/v1/campaign-settings', async (request) => {
    const user = requireUser(request)
    const [client] = await db.select().from(organisations).where(eq(organisations.id, user.organisationId)).limit(1)
    return {
      dailyLimit: client?.dailySendLimit ?? 30,
      warmup: client?.warmupEnabled ?? true,
      trackingDomain: client?.trackingDomain ?? '',
    }
  })

  app.patch('/api/v1/campaign-settings', async (request, reply) => {
    const user = requireUser(request)
    const body = parseBody(
      z.object({
        dailyLimit: z.number().int().min(10).max(40).optional(),
        warmup: z.boolean().optional(),
        trackingDomain: z.string().optional(),
      }),
      request.body,
      reply,
    )
    if (!body) return
    const [updated] = await db
      .update(organisations)
      .set({
        ...(body.dailyLimit !== undefined ? { dailySendLimit: body.dailyLimit } : {}),
        ...(body.warmup !== undefined ? { warmupEnabled: body.warmup } : {}),
        ...(body.trackingDomain !== undefined ? { trackingDomain: body.trackingDomain } : {}),
      })
      .where(eq(organisations.id, user.organisationId))
      .returning()
    return {
      dailyLimit: updated?.dailySendLimit,
      warmup: updated?.warmupEnabled,
      trackingDomain: updated?.trackingDomain,
    }
  })

  app.get('/api/v1/sending-domains', async (request) => {
    const user = requireUser(request)
    const rows = await db.select().from(sendingDomains).where(eq(sendingDomains.organisationId, user.organisationId)).orderBy(asc(sendingDomains.createdAt))
    return { data: rows.map(presentDomain) }
  })

  app.post('/api/v1/sending-domains', async (request, reply) => {
    const user = requireUser(request)
    const body = parseBody(
      z.object({
        name: z.string().min(3),
        inboxes: z.number().int().nonnegative().default(0),
        health: z.string().default('Setup'),
        status: z.string().default('Verifying'),
      }),
      request.body,
      reply,
    )
    if (!body) return
    const name = body.name.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    const [created] = await db
      .insert(sendingDomains)
      .values({ organisationId: user.organisationId, name, inboxes: body.inboxes, health: body.health, status: body.status })
      .returning()
    return reply.code(201).send(created ? presentDomain(created) : { error: 'Could not add domain' })
  })

  app.delete('/api/v1/sending-domains/:id', async (request, reply) => {
    const user = requireUser(request)
    const { id } = request.params as { id: string }
    const [removed] = await db
      .delete(sendingDomains)
      .where(eq(sendingDomains.id, id))
      .returning()
    if (!removed || removed.organisationId !== user.organisationId) return reply.code(404).send({ error: 'Domain not found' })
    return { id: removed.id, name: removed.name }
  })
}

function presentDomain(row: typeof sendingDomains.$inferSelect) {
  return { id: row.id, name: row.name, inboxes: row.inboxes, health: row.health, status: row.status }
}

async function setStatus(request: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply, status: 'paused' | 'live') {
  const user = requireUser(request)
  const { id } = request.params as { id: string }
  const [existing] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1)
  if (!existing || existing.organisationId !== user.organisationId) return reply.code(404).send({ error: 'Campaign not found' })
  if (existing.status === 'draft' && status === 'paused') return reply.code(400).send({ error: 'Draft campaigns cannot be paused' })
  const next = status === 'live' && existing.status === 'draft' ? 'draft' : status
  const [updated] = await db.update(campaigns).set({ status: next, updatedAt: new Date() }).where(eq(campaigns.id, id)).returning()
  return updated ? presentCampaign(updated) : { error: 'Could not update campaign' }
}
