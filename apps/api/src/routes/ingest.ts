import { desc, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/client.ts'
import { pipelineRuns } from '../db/schema.ts'
import { beginHistoricalBackfill, readIngestQueueStatus } from '../ingest/batch.ts'
import { DEFAULT_HISTORICAL_BACKFILL_DAYS, MAX_HISTORICAL_BACKFILL_DAYS } from '../ingest/queue.ts'
import { enrichMissingContacts, presentRun, readRunCsv, startIngestRun, upsertRows } from '../ingest/run.ts'
import { HttpError, parseBody, requireUser } from '../lib/http.ts'

const runBody = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  authority: z.string().optional(),
  recent: z.number().int().positive().max(30).optional(),
  maxPages: z.number().int().positive().max(40).optional(),
  source: z.enum(['planit', 'london-datahub', 'auto']).optional(),
  enrich: z.boolean().optional(),
})

const enrichBody = z.object({
  limit: z.number().int().positive().max(100).optional(),
})

const backfillBody = z.object({
  days: z.number().int().min(1).max(MAX_HISTORICAL_BACKFILL_DAYS).optional(),
})

const uploadBody = z.object({
  batchName: z.string().optional(),
  records: z.array(z.record(z.string(), z.string())).min(1).max(5000),
})

export async function ingestRoutes(app: FastifyInstance) {
  app.get('/api/v1/ingest/runs', async (request) => {
    requireUser(request)
    const rows = await db.select().from(pipelineRuns).orderBy(desc(pipelineRuns.startedAt)).limit(50)
    const queue = await readIngestQueueStatus()
    return { data: rows.map(presentRun), queue }
  })

  app.get('/api/v1/ingest/runs/:id/csv', async (request, reply) => {
    requireUser(request)
    const parsed = z.string().uuid().safeParse((request.params as { id?: string }).id)
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid request' })
    const id = parsed.data
    const found = await readRunCsv(id)
    if (!found) return reply.code(404).send({ error: 'Run CSV not found' })
    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="planit-${id}.csv"`)
      .send(found.csv)
  })

  app.post('/api/v1/ingest/runs', async (request, reply) => {
    requireUser(request)
    const body = parseBody(runBody, request.body ?? {}, reply)
    if (!body) return
    try {
      const started = await startIngestRun({
        from: body.from,
        to: body.to,
        authority: body.authority,
        recentDays: body.recent ?? (body.from || body.to ? undefined : 3),
        maxPages: body.maxPages,
        source: body.source,
        enrich: body.enrich === true,
      })
      const [run] = await db.select().from(pipelineRuns).where(eq(pipelineRuns.id, started.id)).limit(1)
      return reply.code(202).send(run ? presentRun(run) : { id: started.id, status: 'running' })
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) throw new HttpError(409, error.message)
      throw error
    }
  })

  app.post('/api/v1/ingest/backfill', async (request, reply) => {
    const user = requireUser(request)
    if (user.platformRole !== 'super_admin') throw new HttpError(403, 'Forbidden')
    const body = parseBody(backfillBody, request.body ?? {}, reply)
    if (!body) return
    const queue = await beginHistoricalBackfill(body.days ?? DEFAULT_HISTORICAL_BACKFILL_DAYS)
    return reply.code(202).send(queue)
  })

  app.post('/api/v1/ingest/enrich', async (request, reply) => {
    requireUser(request)
    const body = parseBody(enrichBody, request.body ?? {}, reply)
    if (!body) return
    const result = await enrichMissingContacts({ limit: body.limit ?? 20 })
    return reply.code(200).send(result)
  })

  app.post('/api/v1/ingest/upload', async (request, reply) => {
    requireUser(request)
    const body = parseBody(uploadBody, request.body, reply)
    if (!body) return

    const batchName = body.batchName?.trim() || `Upload ${new Date().toLocaleDateString('en-GB')}`
    const rows = body.records.map((r, idx) => {
      const cleanRow: Record<string, string> = { ...r }
      cleanRow['Application Reference'] = String(r['Application Reference'] || r.reference || r.applicationRef || `APP-${Date.now()}-${idx + 1}`)
      cleanRow['Local Authority'] = String(r['Local Authority'] || r.council || r.authority || 'Unknown LPA')
      cleanRow.Heading = String(r.Heading || r.heading || r.title || 'Planning Application')
      cleanRow.Proposal = String(r.Proposal || r.proposal || r.description || '')
      cleanRow.Source = 'manual_upload'
      cleanRow['Upload Batch'] = batchName
      return cleanRow
    })

    const result = await upsertRows(rows)

    // Record the upload run in pipelineRuns so admins can view upload batches separately
    await db.insert(pipelineRuns).values({
      source: 'manual_upload',
      status: 'completed',
      fetched: rows.length,
      filteredOut: 0,
      inserted: result.inserted,
      updated: result.updated,
      startedAt: new Date(),
      finishedAt: new Date(),
      message: `Manual batch imported: ${result.inserted} added, ${result.updated} updated (${batchName})`,
      options: { authority: batchName },
    })

    return reply.send({
      success: true,
      inserted: result.inserted,
      updated: result.updated,
      total: rows.length,
      batchName,
    })
  })
}

