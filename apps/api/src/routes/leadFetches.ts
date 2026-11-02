import { LEAD_WINDOWS, mapRecord } from '@planningpal/shared'
import { asc, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/client.ts'
import { planningApplications, workspaceLeads } from '../db/schema.ts'
import { ensureApplicationRowEnriched } from '../ingest/run.ts'
import { advanceLeadFetch, currentLeadFetch, retryLeadFetch, startLeadFetch } from '../leads/fetch.ts'
import { parseBody, requireUser } from '../lib/http.ts'

const days = z.object({
  days: z.number().int().refine((value) => LEAD_WINDOWS.some((window) => window.days === value), 'Choose a supported time window'),
})

export async function leadFetchRoutes(app: FastifyInstance) {
  app.get('/api/v1/lead-fetches/current', async (request) => {
    const user = requireUser(request)
    if (!user.organisationId) return { job: null }
    return { job: await currentLeadFetch(user.organisationId) }
  })

  app.post('/api/v1/lead-fetches', async (request, reply) => {
    const user = requireUser(request)
    if (!user.organisationId) return reply.code(404).send({ error: 'Not found' })
    const body = parseBody(days, request.body, reply)
    if (!body) return
    const job = await startLeadFetch(user.organisationId, body.days)
    return reply.code(201).send({ job })
  })

  app.post('/api/v1/lead-fetches/:id/advance', async (request, reply) => {
    const user = requireUser(request)
    if (!user.organisationId) return reply.code(404).send({ error: 'Not found' })
    const { id } = request.params as { id: string }
    if (!z.string().uuid().safeParse(id).success) return reply.code(404).send({ error: 'Not found' })
    const job = await advanceLeadFetch(user.organisationId, id)
    return { job }
  })

  app.post('/api/v1/lead-fetches/:id/retry', async (request, reply) => {
    const user = requireUser(request)
    if (!user.organisationId) return reply.code(404).send({ error: 'Not found' })
    const { id } = request.params as { id: string }
    if (!z.string().uuid().safeParse(id).success) return reply.code(404).send({ error: 'Not found' })
    const job = await retryLeadFetch(user.organisationId, id)
    return { job }
  })

  app.get('/api/v1/workspace-leads', async (request) => {
    const user = requireUser(request)
    if (!user.organisationId) return { data: [] }
    const rows = await db
      .select({ application: planningApplications })
      .from(workspaceLeads)
      .innerJoin(planningApplications, eq(workspaceLeads.applicationId, planningApplications.id))
      .where(eq(workspaceLeads.workspaceId, user.organisationId))
      .orderBy(asc(workspaceLeads.createdAt))
      .limit(200)
    const enriched = await Promise.all(
      rows.map((row) => ensureApplicationRowEnriched(row.application, { allowNetwork: false, persist: true })),
    )
    return { data: enriched.map((appRow) => mapRecord(appRow.sourceRecord, appRow.sourceIndex)) }
  })
}
