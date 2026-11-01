import { CRM_STAGES, mapRecord, stageById, stageByIndex, type CrmStageId } from '@planningpal/shared'
import { and, asc, desc, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/client.ts'
import { activities, crmLeads, planningApplications } from '../db/schema.ts'
import { HttpError, parseBody, requireUser } from '../lib/http.ts'
import { presentActivity } from './planning.ts'

const stageSchema = z.object({
  stage: z.string(),
  notes: z.string().optional(),
})

const activityBody = z.object({
  type: z.enum(['note', 'task', 'call', 'email', 'system']),
  crmLeadId: z.string().uuid().optional(),
  applicationRef: z.string().optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  outcome: z.string().optional(),
  dueOn: z.string().optional(),
})

async function loadCards(organisationId: string) {
  const rows = await db
    .select({ lead: crmLeads, application: planningApplications })
    .from(crmLeads)
    .innerJoin(planningApplications, eq(crmLeads.applicationId, planningApplications.id))
    .where(eq(crmLeads.organisationId, organisationId))
    .orderBy(asc(planningApplications.sourceIndex))

  return rows.map(({ lead, application }) => {
    const scheme = mapRecord(application.sourceRecord, application.sourceIndex)
    const stage = stageById(lead.stage)
    return {
      id: lead.id,
      person: scheme.architect,
      firm: scheme.practice,
      scheme: scheme.title,
      schemeId: scheme.id,
      value: scheme.value,
      opens: lead.openCount,
      stage: stage?.index ?? 0,
      stageId: lead.stage,
      assignee: lead.assigneeName,
      archived: lead.archived,
      deckDownloaded: lead.deckDownloaded,
      applicationId: application.id,
    }
  })
}

function resolveStage(value: string) {
  const byId = stageById(value)
  if (byId) return byId
  const asNumber = Number(value)
  if (Number.isInteger(asNumber)) return stageByIndex(asNumber)
  return undefined
}

export async function crmRoutes(app: FastifyInstance) {
  app.get('/api/v1/crm/kanban', async (request) => {
    const user = requireUser(request)
    const cards = await loadCards(user.organisationId)
    return {
      stages: CRM_STAGES.map((stage) => ({
        id: stage.id,
        index: stage.index,
        label: stage.label,
        cards: cards.filter((card) => card.stageId === stage.id),
      })),
      cards,
      assignees: ['Emily Rhodes', 'James Wilkins', 'Unassigned'],
    }
  })

  app.get('/api/v1/crm/activities', async (request) => {
    const user = requireUser(request)
    const type = typeof request.query === 'object' && request.query && 'type' in request.query ? String(request.query.type) : undefined
    const rows = await db
      .select({ activity: activities, applicationRef: planningApplications.applicationRef })
      .from(activities)
      .leftJoin(planningApplications, eq(activities.applicationId, planningApplications.id))
      .where(type ? and(eq(activities.organisationId, user.organisationId), eq(activities.type, type)) : eq(activities.organisationId, user.organisationId))
      .orderBy(desc(activities.createdAt))
    return { data: rows.map((row) => ({ ...presentActivity(row.activity), applicationRef: row.applicationRef })) }
  })

  app.post('/api/v1/crm/activities', async (request, reply) => {
    const user = requireUser(request)
    const body = parseBody(activityBody, request.body, reply)
    if (!body) return
    let applicationId: string | null = null
    if (body.applicationRef) {
      const [appRow] = await db
        .select({ id: planningApplications.id })
        .from(planningApplications)
        .where(eq(planningApplications.applicationRef, body.applicationRef))
        .limit(1)
      if (!appRow) return reply.code(404).send({ error: 'Planning lead not found' })
      applicationId = appRow.id
    }
    if (body.crmLeadId) {
      const [lead] = await db.select().from(crmLeads).where(and(eq(crmLeads.id, body.crmLeadId), eq(crmLeads.organisationId, user.organisationId))).limit(1)
      if (!lead) return reply.code(404).send({ error: 'CRM lead not found' })
      applicationId = applicationId ?? lead.applicationId
    }
    const titles: Record<string, string> = {
      note: 'Internal note',
      task: 'Follow-up task',
      call: 'Call logged',
      email: 'Email queued',
      system: 'System',
    }
    const [created] = await db
      .insert(activities)
      .values({
        organisationId: user.organisationId,
        userId: user.id,
        crmLeadId: body.crmLeadId,
        applicationId,
        type: body.type,
        title: body.title || titles[body.type] || 'Activity',
        body: body.body ?? '',
        outcome: body.outcome ?? '',
        dueOn: body.dueOn,
      })
      .returning()
    if (!created) throw new HttpError(500, 'Could not save activity')
    return reply.code(201).send(presentActivity(created))
  })

  app.patch('/api/v1/crm/activities/:id', async (request, reply) => {
    const user = requireUser(request)
    const { id } = request.params as { id: string }
    const body = parseBody(z.object({ completed: z.boolean() }), request.body, reply)
    if (!body) return
    const [updated] = await db
      .update(activities)
      .set({ completedAt: body.completed ? new Date() : null })
      .where(and(eq(activities.id, id), eq(activities.organisationId, user.organisationId)))
      .returning()
    if (!updated) return reply.code(404).send({ error: 'Activity not found' })
    return presentActivity(updated)
  })

  app.patch('/api/v1/crm/leads/:id/stage', async (request, reply) => {
    const user = requireUser(request)
    const { id } = request.params as { id: string }
    const body = parseBody(stageSchema, request.body, reply)
    if (!body) return
    const stage = resolveStage(body.stage)
    if (!stage) return reply.code(400).send({ error: 'Unknown CRM stage' })
    const [existing] = await db.select().from(crmLeads).where(and(eq(crmLeads.id, id), eq(crmLeads.organisationId, user.organisationId))).limit(1)
    if (!existing) return reply.code(404).send({ error: 'CRM lead not found' })
    const [updated] = await db
      .update(crmLeads)
      .set({
        stage: stage.id satisfies CrmStageId,
        sdrNotes: body.notes ?? existing.sdrNotes,
        updatedAt: new Date(),
      })
      .where(eq(crmLeads.id, id))
      .returning()
    await db.insert(activities).values({
      organisationId: user.organisationId,
      userId: user.id,
      crmLeadId: id,
      applicationId: existing.applicationId,
      type: 'system',
      title: 'Stage updated',
      body: body.notes ?? `Moved to ${stage.label}`,
    })
    const cards = await loadCards(user.organisationId)
    return { lead: updated, card: cards.find((card) => card.id === id) }
  })

  app.post('/api/v1/crm/leads/:id/archive', async (request, reply) => {
    const user = requireUser(request)
    const { id } = request.params as { id: string }
    const body = parseBody(z.object({ archived: z.boolean() }), request.body, reply)
    if (!body) return
    const [updated] = await db
      .update(crmLeads)
      .set({ archived: body.archived, updatedAt: new Date() })
      .where(and(eq(crmLeads.id, id), eq(crmLeads.organisationId, user.organisationId)))
      .returning()
    if (!updated) return reply.code(404).send({ error: 'CRM lead not found' })
    return { id: updated.id, archived: updated.archived }
  })
}
