import { ingestAuthorityBatch } from './batch.ts'
import { londonParts } from './clock.ts'

export { isIngestSlot } from './clock.ts'

const SLOTS = [6, 13, 20]
let lastSlot = ''

/**
 * Local API timer at 06:00, 13:00 and 20:00 Europe/London.
 * Production ingest is Supabase pg_cron every minute (`* * * * *`), which POSTs
 * to /api/cron/ingest. This timer does not start when VERCEL is set.
 */
export function startIngestScheduler() {
  const tick = () => {
    const now = londonParts()
    if (!SLOTS.includes(now.hour) || now.minute > 1) return
    const slot = `${now.key}T${String(now.hour).padStart(2, '0')}`
    if (slot === lastSlot) return
    lastSlot = slot
    void ingestAuthorityBatch({ force: true }).catch((error: unknown) => {
      console.error('Scheduled PlanIt ingest failed', error)
    })
  }
  const timer = setInterval(tick, 30_000)
  timer.unref?.()
  return () => clearInterval(timer)
}
