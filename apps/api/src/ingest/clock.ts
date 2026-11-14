const SLOTS = [6, 13, 20]

export function londonParts(date = new Date()) {
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

/** Local API timer window. Production ingest is the every-minute pg_cron job. */
export function isIngestSlot(date = new Date()) {
  const now = londonParts(date)
  return SLOTS.includes(now.hour) && now.minute <= 10
}
