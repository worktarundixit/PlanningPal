import { ingestAuthorityBatch } from '../../../api/src/ingest/batch.ts'

type CronRequest = { headers?: { authorization?: string | string[] } }
type CronResponse = { status: (code: number) => { json: (body: unknown) => void } }

/**
 * Vercel Cron entry. Schedules in vercel.json cover both GMT and BST.
 * The function itself only runs at 06:00, 13:00 and 20:00 Europe/London,
 * and processes as many authorities as fit in the time budget.
 */
export default async function handler(request: CronRequest, response: CronResponse) {
  const secret = process.env.CRON_SECRET
  const header = request.headers?.authorization
  const token = Array.isArray(header) ? header[0] : header
  if (process.env.VERCEL_ENV === 'production' || secret) {
    if (!secret || token !== `Bearer ${secret}`) {
      response.status(401).json({ error: 'Unauthorized' })
      return
    }
  }
  const result = await ingestAuthorityBatch()
  response.status(200).json(result)
}
