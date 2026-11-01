import { desc, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/client.ts'
import { pipelineRuns } from '../db/schema.ts'
import { presentRun, readRunCsv, startIngestRun } from '../ingest/run.ts'
import { HttpError, parseBody, requireUser } from '../lib/http.ts'

const runBody = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  authority: z.string().optional(),
  recent: z.number().int().positive().max(30).optional(),
  maxPages: z.number().int().positive().max(40).optional(),
})

export async function ingestRoutes(app: FastifyInstance) {
  app.get('/api/v1/ingest/runs', async (request) => {
    requireUser(request)
    const rows = await db.select().from(pipelineRuns).orderBy(desc(pipelineRuns.startedAt)).limit(50)
    return { data: rows.map(presentRun) }
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
      })
      const [run] = await db.select().from(pipelineRuns).where(eq(pipelineRuns.id, started.id)).limit(1)
      return reply.code(202).send(run ? presentRun(run) : { id: started.id, status: 'running' })
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) throw new HttpError(409, error.message)
      throw error
    }
  })
}
