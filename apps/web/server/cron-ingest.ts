import { ingestAuthorityBatch } from '../../api/src/ingest/batch.ts'

type CronRequest = { headers?: { authorization?: string | string[] } }
type CronResponse = { status: (code: number) => { json: (body: unknown) => void } }

/**
 * Supabase pg_cron POSTs here every minute, all day (`* * * * *`).
 * Apply supabase/migrations/20261114120000_planit_ingest_every_minute.sql
 * on the hosted project by hand. Every call must send Authorization: Bearer $CRON_SECRET.
 * A call with nothing due returns quickly. The London slot check stays on the
 * long-running API timer, not on this route.
 * 200: the batch succeeded or was skipped. 207: partial (a retry was recorded and the sweep moved on). 500: the batch failed.
 */
export function statusForIngestResult(result: { ok?: boolean; skipped?: unknown; partial?: boolean }) {
  if (result.skipped) return 200
  if (result.ok) return 200
  if (result.partial) return 207
  return 500
}

export default async function handler(request: CronRequest, response: CronResponse) {
  const secret = process.env.CRON_SECRET
  const header = request.headers?.authorization
  const token = Array.isArray(header) ? header[0] : header
  if (!secret || token !== `Bearer ${secret}`) {
    response.status(401).json({ error: 'Unauthorized' })
    return
  }
  try {
    const result = await ingestAuthorityBatch({ force: true })
    response.status(statusForIngestResult(result)).json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ingest failed'
    console.error(`PlanIt ingest failed: ${message}`)
    response.status(500).json({ ok: false, skipped: false, partial: false, processed: [], failed: [{ authority: '', error: message }] })
  }
}
