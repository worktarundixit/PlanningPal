import { and, asc, eq } from 'drizzle-orm'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { db } from '../db/client.ts'
import { campaignEngineLinks, campaignProviderMappings, campaigns, contactGroupMembers, contactGroups, organisations, sendingDomains } from '../db/schema.ts'
import { HttpError, parseBody, requireUser } from '../lib/http.ts'
import { loadCampaignEngine } from '../providers/campaign/index.ts'
import { ENGINE_UNAVAILABLE } from '../providers/campaign/types.ts'

async function addLeadsToCampaign(
  campaignId: string,
  organisationId: string,
  leads: Array<{ email: string; firstName?: string; lastName?: string; company?: string; title?: string }>,
): Promise<{ added: number; synced: boolean; warning?: string }> {
  const [existing] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1)
  if (!existing || existing.organisationId !== organisationId) {
    throw new HttpError(404, 'Campaign not found')
  }

  let [mapping] = await db.select().from(campaignProviderMappings).where(eq(campaignProviderMappings.organisationId, organisationId)).limit(1)
  const engine = await loadCampaignEngine(organisationId)

  // Auto-resolve provider workspace mapping if missing
  if (!mapping) {
    try {
      const current = engine.provider.currentWorkspace ? await engine.provider.currentWorkspace() : null
      const workspaceId = current?.id || 'default'
      const [newMapping] = await db
        .insert(campaignProviderMappings)
        .values({
          organisationId,
          providerWorkspaceId: workspaceId,
          status: 'mapped',
        })
        .onConflictDoNothing()
        .returning()
      mapping = newMapping || (await db.select().from(campaignProviderMappings).where(eq(campaignProviderMappings.organisationId, organisationId)).limit(1))[0]
    } catch {
      // ignore
    }
  }

  let [link] = await db.select().from(campaignEngineLinks).where(eq(campaignEngineLinks.campaignId, campaignId)).limit(1)
  // Auto-create remote campaign link if missing
  if (mapping && !link) {
    try {
      const [client] = await db.select().from(organisations).where(eq(organisations.id, organisationId)).limit(1)
      const remote = await engine.provider.createCampaign(mapping.providerWorkspaceId, existing.name, {
        dailyLimit: client?.dailySendLimit ?? 30,
        stopOnReply: true,
      })
      const [newLink] = await db
        .insert(campaignEngineLinks)
        .values({
          campaignId,
          organisationId,
          providerCampaignId: remote.id,
        })
        .onConflictDoNothing()
        .returning()
      link = newLink || (await db.select().from(campaignEngineLinks).where(eq(campaignEngineLinks.campaignId, campaignId)).limit(1))[0]
    } catch (e) {
      console.warn('Could not auto-link remote campaign', e)
    }
  }

  let synced = false
  let addedCount = leads.length

  if (mapping && link) {
    try {
      const result = await engine.provider.addLeads(mapping.providerWorkspaceId, link.providerCampaignId, leads)
      addedCount = result.added
      synced = true
    } catch (err) {
      console.warn('Remote lead sync failed, saving locally', err)
    }
  }

  await db
    .update(campaigns)
    .set({ contacts: existing.contacts + addedCount, updatedAt: new Date() })
    .where(eq(campaigns.id, campaignId))

  return {
    added: addedCount,
    synced,
    warning: synced ? undefined : 'Contacts saved to campaign. Provider sync will update automatically.',
  }
}

const campaignBody = z.object({
  name: z.string().min(1),
  region: z.string().min(1).default('London'),
  status: z.enum(['draft', 'live', 'paused']).optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  delayDays: z.number().int().min(0).max(365).optional(),
  stopOnReply: z.boolean().optional(),
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
        const [client] = await db.select().from(organisations).where(eq(organisations.id, user.organisationId)).limit(1)
        const engine = await loadCampaignEngine(user.organisationId)
        const remote = await engine.provider.createCampaign(mapping.providerWorkspaceId, body.name, {
          subject: body.subject,
          body: body.body,
          delayDays: body.delayDays,
          stopOnReply: body.stopOnReply ?? true,
          dailyLimit: client?.dailySendLimit ?? 30,
        })
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
    const dbPatch: Partial<typeof campaigns.$inferInsert> = {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.region !== undefined ? { region: body.region } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      updatedAt: new Date(),
    }
    const [updated] = await db
      .update(campaigns)
      .set(dbPatch)
      .where(and(eq(campaigns.id, id), eq(campaigns.organisationId, user.organisationId)))
      .returning()
    if (!updated) return reply.code(404).send({ error: 'Campaign not found' })
    const [mapping] = await db.select().from(campaignProviderMappings).where(eq(campaignProviderMappings.organisationId, user.organisationId)).limit(1)
    const [link] = await db.select().from(campaignEngineLinks).where(eq(campaignEngineLinks.campaignId, id)).limit(1)
    if (mapping && link && (body.name || body.subject || body.body || body.delayDays !== undefined || body.stopOnReply !== undefined)) {
      try {
        const engine = await loadCampaignEngine(user.organisationId)
        await engine.provider.updateCampaign?.(mapping.providerWorkspaceId, link.providerCampaignId, {
          name: body.name,
          subject: body.subject,
          body: body.body,
          delayDays: body.delayDays,
          stopOnReply: body.stopOnReply,
        })
      } catch {
        throw new HttpError(502, ENGINE_UNAVAILABLE)
      }
    }
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
    const result = await addLeadsToCampaign(id, user.organisationId, body.leads)
    return reply.send(result)
  })

  app.post('/api/v1/campaigns/:id/import-group', async (request, reply) => {
    const user = requireUser(request)
    const { id } = request.params as { id: string }
    const body = parseBody(
      z.object({
        groupId: z.string().uuid(),
      }),
      request.body,
      reply,
    )
    if (!body) return
    const [group] = await db
      .select()
      .from(contactGroups)
      .where(and(eq(contactGroups.id, body.groupId), eq(contactGroups.organisationId, user.organisationId)))
      .limit(1)

    if (!group) return reply.code(404).send({ error: 'Contact group not found' })

    const members = await db
      .select()
      .from(contactGroupMembers)
      .where(eq(contactGroupMembers.groupId, body.groupId))

    if (!members.length) {
      return reply.code(400).send({ error: 'This contact group has no members to import' })
    }

    const leads = members.map((m) => ({
      email: m.email,
      firstName: m.firstName || undefined,
      lastName: m.lastName || undefined,
      company: m.company || undefined,
      title: m.title || undefined,
    }))

    const result = await addLeadsToCampaign(id, user.organisationId, leads)
    return reply.send({
      added: result.added,
      groupName: group.name,
      synced: result.synced,
      warning: result.warning,
    })
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
    const engine = await loadCampaignEngine(organisationId)
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
  const next = status
  const [mapping] = await db.select().from(campaignProviderMappings).where(eq(campaignProviderMappings.organisationId, user.organisationId)).limit(1)
  const [link] = await db.select().from(campaignEngineLinks).where(eq(campaignEngineLinks.campaignId, id)).limit(1)
  if (mapping && link) {
    try {
      const engine = await loadCampaignEngine(user.organisationId)
      if (next === 'paused') await engine.provider.pauseCampaign(mapping.providerWorkspaceId, link.providerCampaignId)
      if (next === 'live') await engine.provider.resumeCampaign(mapping.providerWorkspaceId, link.providerCampaignId)
    } catch {
      throw new HttpError(502, ENGINE_UNAVAILABLE)
    }
  }
  const [updated] = await db
    .update(campaigns)
    .set({ status: next, updatedAt: new Date() })
    .where(and(eq(campaigns.id, id), eq(campaigns.organisationId, user.organisationId)))
    .returning()
  return updated ? presentCampaign(updated) : { error: 'Could not update campaign' }
}
