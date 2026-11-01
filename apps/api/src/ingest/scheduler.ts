import { startIngestRun } from './run.ts'

const SLOTS = [6, 13, 20]
let lastSlot = ''

function londonNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return { key: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')), minute: Number(get('minute')) }
}

/** Fires at 06:00, 13:00 and 20:00 Europe/London while the API process is up. */
export function startIngestScheduler() {
  const tick = () => {
    const now = londonNow()
    if (!SLOTS.includes(now.hour) || now.minute > 1) return
    const slot = `${now.key}T${String(now.hour).padStart(2, '0')}`
    if (slot === lastSlot) return
    lastSlot = slot
    void startIngestRun({ recentDays: 3 }).catch((error: unknown) => {
      console.error('Scheduled PlanIt ingest failed', error)
    })
  }
  const timer = setInterval(tick, 30_000)
  timer.unref?.()
  return () => clearInterval(timer)
}
