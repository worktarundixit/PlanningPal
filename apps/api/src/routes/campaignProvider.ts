import { timingSafeEqual } from 'node:crypto'
import { asc, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/client.ts'
import { campaignProviderMappings, campaignProviderSettings, crmLeads, intentEvents, organisations, planningApplications } from '../db/schema.ts'
import { HttpError, parseBody, requireUser } from '../lib/http.ts'
import { maskSecret, openSecret, sealSecret } from '../providers/campaign/crypto.ts'
import { loadCampaignEngine, readProviderEvent } from '../providers/campaign/index.ts'
import { ENGINE_UNAVAILABLE } from '../providers/campaign/types.ts'

function encryptionSecret() {
  const secret = process.env.CAMPAIGN_KEY_ENCRYPTION_SECRET
  if (!secret) throw new HttpError(503, 'Campaign key storage is not configured')
  return secret
}

function secretsMatch(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  if (a.length !== b.length || a.length === 0) return false
  return timingSafeEqual(a, b)
}

function webhookTarget() {
  const origin = (process.env.WEB_ORIGIN || 'http://127.0.0.1:5173').replace(/\/$/, '')
  const token = process.env.CAMPAIGN_WEBHOOK_SECRET || ''
  return token ? `${origin}/api/v1/campaign-events/${token}` : ''
}

const actions = {
  open: 'opened your campaign email',
  reply: 'replied to your campaign',
  bounce: 'could not be reached',
  click: 'clicked a campaign link',
} as const

export async function campaignProviderRoutes(app: FastifyInstance) {
  app.get('/api/v1/campaign-provider', async (request) => {
    requireUser(request)
    const [row] = await db.select().from(campaignProviderSettings).limit(1)
    const engine = await loadCampaignEngine()
    return {
      configured: Boolean(row),
      hint: row?.hint ?? '',
      mode: engine.mode,
    }
  })

  app.put('/api/v1/campaign-provider', async (request, reply) => {
    requireUser(request)
    const body = parseBody(z.object({ apiKey: z.string() }), request.body, reply)
    if (!body) return
    const apiKey = body.apiKey.trim()
    await db.delete(campaignProviderSettings)
    if (!apiKey) return { configured: false, hint: '', mode: 'sandbox' as const }
    const secret = encryptionSecret()
    const [saved] = await db
      .insert(campaignProviderSettings)
      .values({ ciphertext: sealSecret(apiKey, secret), hint: maskSecret(apiKey), updatedAt: new Date() })
      .returning()
    if (saved && openSecret(saved.ciphertext, secret) !== apiKey) throw new HttpError(500, 'Campaign key storage failed')
    const engine = await loadCampaignEngine()
    return { configured: true, hint: saved?.hint ?? maskSecret(apiKey), mode: engine.mode }
  })

  app.get('/api/v1/campaign-provider/workspaces', async (request) => {
    requireUser(request)
    try {
      const engine = await loadCampaignEngine()
      const data = await engine.provider.listWorkspaces()
      return { data: data.map((workspace) => ({ id: workspace.id, name: workspace.name, status: workspace.status })), canCreate: false }
    } catch {
      throw new HttpError(502, ENGINE_UNAVAILABLE)
    }
  })

  app.get('/api/v1/campaign-provider/mappings', async (request) => {
    requireUser(request)
    const clients = await db.select().from(organisations).orderBy(asc(organisations.companyName))
    const mappings = await db.select().from(campaignProviderMappings)
    const byOrg = new Map(mappings.map((mapping) => [mapping.organisationId, mapping]))
    return {
      data: clients.map((client) => {
        const mapping = byOrg.get(client.id)
        return {
          organisationId: client.id,
          organisationName: client.companyName,
          providerWorkspaceId: mapping?.providerWorkspaceId ?? '',
          trackingDomain: mapping?.trackingDomain ?? '',
          status: mapping?.status ?? 'unmapped',
          webhookStatus: mapping?.webhookStatus ?? 'unknown',
          health: mapping?.health ?? 'unknown',
        }
      }),
    }
  })

  app.put('/api/v1/campaign-provider/mappings', async (request, reply) => {
    requireUser(request)
    const body = parseBody(
      z.object({
        organisationId: z.string().uuid(),
        providerWorkspaceId: z.string().min(1),
        trackingDomain: z.string().default(''),
      }),
      request.body,
      reply,
    )
    if (!body) return
    const [client] = await db.select().from(organisations).where(eq(organisations.id, body.organisationId)).limit(1)
    if (!client) return reply.code(404).send({ error: 'Client not found' })
    const domain = (body.trackingDomain ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    let webhookStatus = process.env.CAMPAIGN_WEBHOOK_SECRET ? 'unknown' : 'not_configured'
    let health = 'attention'
    try {
      const engine = await loadCampaignEngine()
      const target = webhookTarget()
      webhookStatus = target ? await engine.provider.registerWebhook(body.providerWorkspaceId, target) : 'not_configured'
      health = webhookStatus === 'registered' || webhookStatus === 'sandbox' ? 'ok' : 'attention'
    } catch {
      webhookStatus = 'error'
      health = 'attention'
    }
    const values = {
      organisationId: body.organisationId,
      providerWorkspaceId: body.providerWorkspaceId.trim(),
      trackingDomain: domain,
      status: 'mapped',
      webhookStatus,
      health,
      updatedAt: new Date(),
    }
    const [saved] = await db
      .insert(campaignProviderMappings)
      .values(values)
      .onConflictDoUpdate({
        target: campaignProviderMappings.organisationId,
        set: {
          providerWorkspaceId: values.providerWorkspaceId,
          trackingDomain: values.trackingDomain,
          status: values.status,
          webhookStatus: values.webhookStatus,
          health: values.health,
          updatedAt: values.updatedAt,
        },
      })
      .returning()
    return {
      organisationId: saved?.organisationId,
      providerWorkspaceId: saved?.providerWorkspaceId,
      trackingDomain: saved?.trackingDomain,
      status: saved?.status,
      webhookStatus: saved?.webhookStatus,
      health: saved?.health,
    }
  })

  app.post('/api/v1/campaign-events/:token', { config: { public: true } }, async (request, reply) => {
    const { token } = request.params as { token: string }
    const header = request.headers['x-campaign-webhook-token']
    const presented = token || (Array.isArray(header) ? header[0] : header) || ''
    const expected = process.env.CAMPAIGN_WEBHOOK_SECRET || ''
    if (!secretsMatch(presented, expected)) return reply.code(401).send({ error: 'Unauthorized' })
    const event = readProviderEvent(request.body)
    if (!event) return reply.code(202).send({ ok: true, ignored: true })
    const [mapping] = await db
      .select()
      .from(campaignProviderMappings)
      .where(eq(campaignProviderMappings.providerWorkspaceId, event.workspaceId))
      .limit(1)
    if (!mapping) return reply.code(202).send({ ok: true, ignored: true })
    const localName = event.email.split('@')[0]?.replace(/[._-]/g, ' ') || 'Contact'
    const actorName = localName.replace(/\b\w/g, (letter) => letter.toUpperCase())
    let crmLeadId: string | null = null
    const rows = await db
      .select({ source: planningApplications.sourceRecord, leadId: crmLeads.id, opens: crmLeads.openCount })
      .from(crmLeads)
      .innerJoin(planningApplications, eq(crmLeads.applicationId, planningApplications.id))
      .where(eq(crmLeads.organisationId, mapping.organisationId))
      .limit(200)
    for (const row of rows) {
      if (!JSON.stringify(row.source).toLowerCase().includes(event.email)) continue
      crmLeadId = row.leadId
      if (event.kind === 'open' || event.kind === 'click') {
        await db.update(crmLeads).set({ openCount: row.opens + 1, lastOpenedAt: new Date(), updatedAt: new Date() }).where(eq(crmLeads.id, row.leadId))
      }
      break
    }
    await db.insert(intentEvents).values({
      organisationId: mapping.organisationId,
      crmLeadId,
      actorName,
      actorInitials: actorName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'PP',
      action: actions[event.kind],
      detail: 'PlanningPal campaign',
      hot: event.kind === 'reply' || event.kind === 'click',
      timeLabel: 'Just now',
    })
    return { ok: true }
  })
}
