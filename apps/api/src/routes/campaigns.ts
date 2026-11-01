import { and, asc, eq } from 'drizzle-orm'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { db } from '../db/client.ts'
import { campaignEngineLinks, campaignProviderMappings, campaigns, organisations, sendingDomains } from '../db/schema.ts'
import { HttpError, parseBody, requireUser } from '../lib/http.ts'
import { loadCampaignEngine } from '../providers/campaign/index.ts'
import { ENGINE_UNAVAILABLE } from '../providers/campaign/types.ts'

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
    await refreshAnalytics(user.organisationId)
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
    if (!created) return reply.code(500).send({ error: 'Could not create campaign' })
    const [mapping] = await db.select().from(campaignProviderMappings).where(eq(campaignProviderMappings.organisationId, user.organisationId)).limit(1)
    if (mapping) {
      try {
        const engine = await loadCampaignEngine()
        const remote = await engine.provider.createCampaign(mapping.providerWorkspaceId, body.name)
        await db.insert(campaignEngineLinks).values({
          campaignId: created.id,
          organisationId: user.organisationId,
          providerCampaignId: remote.id,
        })
      } catch {
        await db.delete(campaigns).where(eq(campaigns.id, created.id))
        throw new HttpError(502, ENGINE_UNAVAILABLE)
      }
    }
    return reply.code(201).send(presentCampaign(created))
  })

  app.patch('/api/v1/campaigns/:id', async (request, reply) => {
    const user = requireUser(request)
    const { id } = request.params as { id: string }
    const body = parseBody(campaignBody.partial(), request.body, reply)
    if (!body) return
    const [updated] = await db
      .update(campaigns)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(campaigns.id, id), eq(campaigns.organisationId, user.organisationId)))
      .returning()
    if (!updated) return reply.code(404).send({ error: 'Campaign not found' })
    return presentCampaign(updated)
  })

  app.post('/api/v1/campaigns/:id/pause', async (request, reply) => setStatus(request, reply, 'paused'))
  app.post('/api/v1/campaigns/:id/resume', async (request, reply) => setStatus(request, reply, 'live'))

  app.post('/api/v1/campaigns/:id/leads', async (request, reply) => {
    const user = requireUser(request)
    const { id } = request.params as { id: string }
    const body = parseBody(
      z.object({
        leads: z
          .array(
            z.object({
              email: z.string().email(),
              firstName: z.string().optional(),
              lastName: z.string().optional(),
              company: z.string().optional(),
              title: z.string().optional(),
            }),
          )
          .min(1)
          .max(5000),
      }),
      request.body,
      reply,
    )
    if (!body) return
    const [existing] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1)
    if (!existing || existing.organisationId !== user.organisationId) return reply.code(404).send({ error: 'Campaign not found' })
    const [mapping] = await db.select().from(campaignProviderMappings).where(eq(campaignProviderMappings.organisationId, user.organisationId)).limit(1)
    const [link] = await db.select().from(campaignEngineLinks).where(eq(campaignEngineLinks.campaignId, id)).limit(1)
    if (!mapping || !link) return reply.code(409).send({ error: 'This workspace is not connected to the campaign engine yet.' })
    try {
      const engine = await loadCampaignEngine()
      const result = await engine.provider.addLeads(mapping.providerWorkspaceId, link.providerCampaignId, body.leads)
      await db.update(campaigns).set({ contacts: existing.contacts + result.added, updatedAt: new Date() }).where(eq(campaigns.id, id))
      return { added: result.added }
    } catch {
      throw new HttpError(502, ENGINE_UNAVAILABLE)
    }
  })

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
      .where(and(eq(sendingDomains.id, id), eq(sendingDomains.organisationId, user.organisationId)))
      .returning()
    if (!removed) return reply.code(404).send({ error: 'Domain not found' })
    return { id: removed.id, name: removed.name }
  })
}

function presentDomain(row: typeof sendingDomains.$inferSelect) {
  return { id: row.id, name: row.name, inboxes: row.inboxes, health: row.health, status: row.status }
}

async function refreshAnalytics(organisationId: string) {
  const links = await db.select().from(campaignEngineLinks).where(eq(campaignEngineLinks.organisationId, organisationId))
  if (!links.length) return
  const [mapping] = await db.select().from(campaignProviderMappings).where(eq(campaignProviderMappings.organisationId, organisationId)).limit(1)
  if (!mapping) return
  try {
    const engine = await loadCampaignEngine()
    for (const link of links) {
      const stats = await engine.provider.analytics(mapping.providerWorkspaceId, link.providerCampaignId)
      await db.update(campaigns).set({ sent: stats.sent, openRate: stats.openRate, replyRate: stats.replyRate, updatedAt: new Date() }).where(eq(campaigns.id, link.campaignId))
    }
  } catch {
    // Keep the figures already stored for this workspace.
  }
}

async function setStatus(request: FastifyRequest, reply: FastifyReply, status: 'paused' | 'live') {
  const user = requireUser(request)
  const { id } = request.params as { id: string }
  const [existing] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1)
  if (!existing || existing.organisationId !== user.organisationId) return reply.code(404).send({ error: 'Campaign not found' })
  if (existing.status === 'draft' && status === 'paused') return reply.code(400).send({ error: 'Draft campaigns cannot be paused' })
  const next = status === 'live' && existing.status === 'draft' ? 'draft' : status
  if (next !== 'draft') {
    const [mapping] = await db.select().from(campaignProviderMappings).where(eq(campaignProviderMappings.organisationId, user.organisationId)).limit(1)
    const [link] = await db.select().from(campaignEngineLinks).where(eq(campaignEngineLinks.campaignId, id)).limit(1)
    if (mapping && link) {
      try {
        const engine = await loadCampaignEngine()
        if (next === 'paused') await engine.provider.pauseCampaign(mapping.providerWorkspaceId, link.providerCampaignId)
        if (next === 'live') await engine.provider.resumeCampaign(mapping.providerWorkspaceId, link.providerCampaignId)
      } catch {
        throw new HttpError(502, ENGINE_UNAVAILABLE)
      }
    }
  }
  const [updated] = await db
    .update(campaigns)
    .set({ status: next, updatedAt: new Date() })
    .where(and(eq(campaigns.id, id), eq(campaigns.organisationId, user.organisationId)))
    .returning()
  return updated ? presentCampaign(updated) : { error: 'Could not update campaign' }
}
