import { createHmac, timingSafeEqual } from 'node:crypto'
import { stageById } from '@planningpal/shared'
import { and, eq, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { isProductionAuth } from '../auth/mode.ts'
import { db } from '../db/client.ts'
import { activities, crmLeads, decisionMakers, planningApplications, telemetryEvents } from '../db/schema.ts'

const payloadSchema = z.object({
  event_id: z.string().min(1),
  event_type: z.enum(['email_opened', 'link_clicked', 'email_replied']),
  timestamp: z.string().optional(),
  data: z.object({
    campaign_id: z.string().optional(),
    lead_email: z.string().email(),
    application_ref: z.string().min(1),
    open_count: z.number().int().nonnegative().optional(),
    user_agent: z.string().optional(),
    ip_address: z.string().optional(),
  }),
})

function signaturesMatch(secret: string, raw: string, header: string | undefined) {
  if (!header) return false
  const expected = createHmac('sha256', secret).update(raw).digest('hex')
  const left = Buffer.from(header)
  const right = Buffer.from(expected)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export async function telemetryRoutes(app: FastifyInstance) {
  app.post('/api/v1/telemetry/event', { config: { public: true } }, async (request, reply) => {
    const secret = process.env.TELEMETRY_SECRET
    if (secret) {
      const header = request.headers['x-aec-signature']
      const signature = Array.isArray(header) ? header[0] : header
      if (!signaturesMatch(secret, request.rawBody ?? '', signature)) {
        return reply.code(401).send({ error: 'Invalid telemetry signature' })
      }
    } else if (isProductionAuth()) {
      return reply.code(401).send({ error: 'Telemetry secret is not configured' })
    }

    const parsed = payloadSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid request', details: parsed.error.flatten() })
    const event = parsed.data

    const [existing] = await db.select().from(telemetryEvents).where(eq(telemetryEvents.eventId, event.event_id)).limit(1)
    if (existing) return { ok: true, duplicate: true }

    await db.insert(telemetryEvents).values({
      eventId: event.event_id,
      eventType: event.event_type,
      payload: event,
    })

    const [application] = await db
      .select()
      .from(planningApplications)
      .where(eq(planningApplications.applicationRef, event.data.application_ref))
      .limit(1)
    if (!application) return { ok: true, duplicate: false, matched: false }

    const makers = await db
      .select()
      .from(decisionMakers)
      .where(and(eq(decisionMakers.applicationId, application.id), sql`lower(${decisionMakers.email}) = ${event.data.lead_email.toLowerCase()}`))
    const leads = await db.select().from(crmLeads).where(eq(crmLeads.applicationId, application.id))
    let promoted = false
    for (const lead of leads) {
      const openCount = event.event_type === 'email_opened' ? Math.max(lead.openCount + 1, event.data.open_count ?? lead.openCount + 1) : lead.openCount
      const deckDownloaded = lead.deckDownloaded || event.event_type === 'link_clicked'
      const current = stageById(lead.stage)
      const highIntent = openCount >= 3 || deckDownloaded
      const nextStage = highIntent && (current?.index ?? 0) < 2 ? 'STAGE_3_INTENT' : lead.stage
      if (nextStage !== lead.stage) promoted = true
      await db
        .update(crmLeads)
        .set({
          openCount,
          deckDownloaded,
          stage: nextStage,
          intentScore: openCount * 10 + (deckDownloaded ? 25 : 0),
          lastOpenedAt: event.event_type === 'email_opened' ? new Date(event.timestamp ?? Date.now()) : lead.lastOpenedAt,
          updatedAt: new Date(),
        })
        .where(eq(crmLeads.id, lead.id))
      await db.insert(activities).values({
        organisationId: lead.organisationId,
        crmLeadId: lead.id,
        applicationId: application.id,
        type: 'system',
        title: event.event_type,
        body: `${event.data.lead_email} · ${event.event_type}`,
      })
    }

    return { ok: true, duplicate: false, matched: makers.length > 0 || leads.length > 0, promoted }
  })
}
