import { MASTER_COLUMNS, mapRecord, toCsv, type Scheme, type SourceRecord } from '@planningpal/shared'
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/client.ts'
import { activities, decisionMakers, planningApplications, savedSchemes } from '../db/schema.ts'
import { parseBody, requireUser } from '../lib/http.ts'

const leadQuery = z.object({
  county: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  min_val: z.coerce.number().optional(),
  max_val: z.coerce.number().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(50),
  q: z.string().optional(),
  region: z.string().optional(),
  contact: z.enum(['direct', 'partial', 'missing']).optional(),
  authority: z.string().optional(),
  sort: z.enum(['source', 'value']).default('source'),
  direction: z.enum(['asc', 'desc']).default('asc'),
})

const exportBody = z.object({
  format: z.enum(['csv', 'xlsx']).default('csv'),
  filter_params: z
    .object({
      ids: z.array(z.string()).optional(),
      county: z.string().optional(),
      category: z.string().optional(),
      status: z.string().optional(),
      min_val: z.number().optional(),
      max_val: z.number().optional(),
      region: z.string().optional(),
      q: z.string().optional(),
    })
    .optional(),
})

function normaliseCategory(value: string) {
  return value.replaceAll('_', ' ').trim().toUpperCase()
}

function schemeFromRow(row: { sourceRecord: SourceRecord; sourceIndex: number }): Scheme {
  return mapRecord(row.sourceRecord, row.sourceIndex)
}

export async function planningRoutes(app: FastifyInstance) {
  app.get('/api/v1/planning/leads', async (request, reply) => {
    const user = requireUser(request)
    const query = parseBody(leadQuery, request.query, reply)
    if (!query) return

    const filters: SQL[] = []
    if (query.county) filters.push(eq(planningApplications.county, query.county))
    if (query.region) filters.push(eq(planningApplications.region, query.region))
    if (query.authority) filters.push(eq(planningApplications.localAuthority, query.authority))
    if (query.category) filters.push(eq(planningApplications.primaryCategory, normaliseCategory(query.category)))
    if (query.status) {
      if (query.status.toLowerCase() === 'approved') filters.push(eq(planningApplications.status, 'Approved'))
      else filters.push(eq(planningApplications.projectStage, query.status))
    }
    if (query.min_val !== undefined) filters.push(gte(planningApplications.valueToM, query.min_val.toFixed(3)))
    if (query.max_val !== undefined) filters.push(lte(planningApplications.valueFromM, query.max_val.toFixed(3)))
    if (query.contact === 'direct') {
      filters.push(sql`${planningApplications.architectAgentEmail} <> '' AND ${planningApplications.architectAgentPhone} <> ''`)
    } else if (query.contact === 'partial') {
      filters.push(sql`(
        (${planningApplications.architectAgentEmail} <> '' OR ${planningApplications.architectAgentPhone} <> '')
        AND NOT (${planningApplications.architectAgentEmail} <> '' AND ${planningApplications.architectAgentPhone} <> '')
      )`)
    } else if (query.contact === 'missing') {
      filters.push(sql`${planningApplications.architectAgentEmail} = '' AND ${planningApplications.architectAgentPhone} = ''`)
    }
    if (query.q) {
      const pattern = `%${query.q}%`
      const search = or(
        ilike(planningApplications.heading, pattern),
        ilike(planningApplications.applicationRef, pattern),
        ilike(planningApplications.siteAddress, pattern),
        ilike(planningApplications.siteRawAddress, pattern),
        ilike(planningApplications.localAuthority, pattern),
        ilike(planningApplications.architectAgent, pattern),
        ilike(planningApplications.architectAgentContact, pattern),
        ilike(planningApplications.clientApplicant, pattern),
      )
      if (search) filters.push(search)
    }

    const where = filters.length ? and(...filters) : undefined
    const order =
      query.sort === 'value'
        ? query.direction === 'desc'
          ? desc(planningApplications.valueToM)
          : asc(planningApplications.valueToM)
        : query.direction === 'desc'
          ? desc(planningApplications.sourceIndex)
          : asc(planningApplications.sourceIndex)

    const [totalRow] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(planningApplications)
      .where(where)
    const page = query.page ?? 1
    const limit = query.limit ?? 50
    const rows = await db
      .select()
      .from(planningApplications)
      .where(where)
      .orderBy(order)
      .limit(limit)
      .offset((page - 1) * limit)

    const saved = await db
      .select({ applicationId: savedSchemes.applicationId })
      .from(savedSchemes)
      .where(eq(savedSchemes.userId, user.id))
    const savedIds = new Set(saved.map((item) => item.applicationId))

    return {
      data: rows.map((row) => ({ ...schemeFromRow(row), saved: savedIds.has(row.id) })),
      page,
      limit,
      total: totalRow?.total ?? 0,
    }
  })

  app.get('/api/v1/planning/leads/:id', async (request, reply) => {
    requireUser(request)
    const { id } = request.params as { id: string }
    const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    const [row] = await db
      .select()
      .from(planningApplications)
      .where(uuidLike ? or(eq(planningApplications.applicationRef, id), eq(planningApplications.id, id)) : eq(planningApplications.applicationRef, id))
      .limit(1)
    if (!row) return reply.code(404).send({ error: 'Planning lead not found' })

    const contacts = await db.select().from(decisionMakers).where(eq(decisionMakers.applicationId, row.id))
    const history = await db.select().from(activities).where(eq(activities.applicationId, row.id)).orderBy(desc(activities.createdAt))
    const scheme = schemeFromRow(row)
    const populated = Object.values(scheme.raw).filter(Boolean).length

    return {
      scheme,
      summary: {
        heading: scheme.title,
        council: scheme.council,
        value: scheme.value,
        status: scheme.stage,
        populatedColumns: populated,
        columnCount: MASTER_COLUMNS.length,
      },
      contacts: contacts.map((contact) => ({
        id: contact.id,
        role: contact.role,
        firmName: contact.firmName,
        contactName: contact.contactName,
        email: contact.email,
        phone: contact.phone,
        rawAddress: contact.rawAddress,
        confidenceLevel: contact.confidenceLevel,
      })),
      activities: history.map(presentActivity),
    }
  })

  app.post('/api/v1/planning/leads/export', async (request, reply) => {
    requireUser(request)
    const body = parseBody(exportBody, request.body ?? {}, reply)
    if (!body) return
    const params = body.filter_params
    const filters: SQL[] = []
    if (params?.ids?.length) filters.push(inArray(planningApplications.applicationRef, params.ids))
    if (params?.county) filters.push(eq(planningApplications.county, params.county))
    if (params?.region) filters.push(eq(planningApplications.region, params.region))
    if (params?.category) filters.push(eq(planningApplications.primaryCategory, normaliseCategory(params.category)))
    if (params?.status) {
      if (params.status.toLowerCase() === 'approved') filters.push(eq(planningApplications.status, 'Approved'))
      else filters.push(eq(planningApplications.projectStage, params.status))
    }
    if (params?.min_val !== undefined) filters.push(gte(planningApplications.valueToM, params.min_val.toFixed(3)))
    if (params?.max_val !== undefined) filters.push(lte(planningApplications.valueFromM, params.max_val.toFixed(3)))
    if (params?.q) {
      const pattern = `%${params.q}%`
      const search = or(ilike(planningApplications.heading, pattern), ilike(planningApplications.applicationRef, pattern))
      if (search) filters.push(search)
    }

    const rows = await db
      .select({ sourceRecord: planningApplications.sourceRecord, sourceIndex: planningApplications.sourceIndex, applicationRef: planningApplications.applicationRef })
      .from(planningApplications)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(asc(planningApplications.sourceIndex))

    const ordered = params?.ids?.length
      ? params.ids.flatMap((id) => rows.filter((row) => row.applicationRef === id))
      : rows
    const csv = toCsv(ordered.map((row) => row.sourceRecord))
    const stamp = new Date().toISOString().slice(0, 10)
    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="planningpal-schemes-${stamp}.csv"`)
      .header('X-AEC-Export-Format', body.format === 'xlsx' ? 'csv-stub-for-xlsx' : 'csv')
      .send(csv)
  })

  app.get('/api/v1/saved-schemes', async (request) => {
    const user = requireUser(request)
    const rows = await db
      .select({ applicationRef: planningApplications.applicationRef })
      .from(savedSchemes)
      .innerJoin(planningApplications, eq(savedSchemes.applicationId, planningApplications.id))
      .where(eq(savedSchemes.userId, user.id))
      .orderBy(asc(savedSchemes.createdAt))
    return { ids: rows.map((row) => row.applicationRef) }
  })

  app.post('/api/v1/saved-schemes', async (request, reply) => {
    const user = requireUser(request)
    const body = parseBody(z.object({ applicationRef: z.string().min(1) }), request.body, reply)
    if (!body) return
    const saved = await saveRef(user.id, body.applicationRef)
    if (!saved) return reply.code(404).send({ error: 'Planning lead not found' })
    return { saved: true, applicationRef: body.applicationRef }
  })

  app.post('/api/v1/saved-schemes/bulk', async (request, reply) => {
    const user = requireUser(request)
    const body = parseBody(z.object({ applicationRefs: z.array(z.string().min(1)).min(1) }), request.body, reply)
    if (!body) return
    let count = 0
    for (const applicationRef of body.applicationRefs) {
      const saved = await saveRef(user.id, applicationRef)
      if (saved) count += 1
    }
    return { saved: count }
  })

  app.delete('/api/v1/saved-schemes/:ref', async (request, reply) => {
    const user = requireUser(request)
    const { ref } = request.params as { ref: string }
    const [appRow] = await db
      .select({ id: planningApplications.id })
      .from(planningApplications)
      .where(eq(planningApplications.applicationRef, decodeURIComponent(ref)))
      .limit(1)
    if (!appRow) return reply.code(404).send({ error: 'Planning lead not found' })
    await db.delete(savedSchemes).where(and(eq(savedSchemes.userId, user.id), eq(savedSchemes.applicationId, appRow.id)))
    return { saved: false, applicationRef: decodeURIComponent(ref) }
  })
}

async function saveRef(userId: string, applicationRef: string) {
  const [appRow] = await db
    .select({ id: planningApplications.id })
    .from(planningApplications)
    .where(eq(planningApplications.applicationRef, applicationRef))
    .limit(1)
  if (!appRow) return false
  await db
    .insert(savedSchemes)
    .values({ userId, applicationId: appRow.id })
    .onConflictDoNothing({ target: [savedSchemes.userId, savedSchemes.applicationId] })
  return true
}

export function presentActivity(activity: typeof activities.$inferSelect) {
  return {
    id: activity.id,
    type: activity.type,
    title: activity.title,
    body: activity.body,
    outcome: activity.outcome,
    dueOn: activity.dueOn,
    completedAt: activity.completedAt,
    crmLeadId: activity.crmLeadId,
    applicationId: activity.applicationId,
    createdAt: activity.createdAt,
  }
}
