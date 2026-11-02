import { ingestAuthorityBatch } from '../../api/src/ingest/batch.ts'

type CronRequest = { headers?: { authorization?: string | string[] } }
type CronResponse = { status: (code: number) => { json: (body: unknown) => void } }

/**
 * Supabase pg_cron POSTs here at 06:00, 13:00 and 20:00 UTC.
 * Every call must send Authorization: Bearer $CRON_SECRET.
 * A valid call runs a batch immediately. The London slot check stays on the
 * long-running API timer, not on this route.
 */
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
    response.status(200).json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ingest failed'
    console.error(`PlanIt ingest failed: ${message}`)
    response.status(200).json({ ok: false, skipped: false, processed: [], failed: [{ authority: '', error: message }] })
  }
}
