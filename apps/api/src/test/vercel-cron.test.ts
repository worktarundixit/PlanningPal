import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

type VercelConfig = { crons?: { path: string; schedule: string }[] }

function runsMoreThanOncePerDay(expression: string) {
  const [minute, hour] = expression.trim().split(/\s+/)
  const repeats = (field: string | undefined) => !field || field.includes(',') || field.includes('/') || field.includes('-')
  return repeats(minute) || repeats(hour)
}

describe('Vercel cron config', () => {
  it('keeps Hobby previews free of multi-run schedules', () => {
    const config = JSON.parse(readFileSync(new URL('../../../web/vercel.json', import.meta.url), 'utf8')) as VercelConfig
    const crons = config.crons ?? []
    expect(crons.filter((cron) => runsMoreThanOncePerDay(cron.schedule))).toEqual([])
  })
})
