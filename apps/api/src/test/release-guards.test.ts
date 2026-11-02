import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { isProductionAuth } from '../auth/mode.ts'
import { mailer } from '../auth/mailer.ts'
import { db } from '../db/client.ts'
import { runMigrations } from '../db/migrate.ts'
import { mailLog } from '../db/schema.ts'

describe('production auth mode', () => {
  it('treats supabase like strict production auth', () => {
    expect(isProductionAuth({ AUTH_MODE: 'supabase' } as NodeJS.ProcessEnv)).toBe(true)
    expect(isProductionAuth({ AUTH_MODE: 'strict' } as NodeJS.ProcessEnv)).toBe(true)
    expect(isProductionAuth({ AUTH_MODE: 'dev' } as NodeJS.ProcessEnv)).toBe(false)
    expect(isProductionAuth({} as NodeJS.ProcessEnv)).toBe(false)
  })
})

describe('product mail without Resend', () => {
  const recipient = 'release-mail@planningpal.test'

  beforeAll(async () => {
    await runMigrations()
  })

  afterAll(async () => {
    await db.delete(mailLog).where(eq(mailLog.recipient, recipient))
  })

  it('logs the message and does not throw when RESEND_API_KEY is missing', async () => {
    const previous = process.env.RESEND_API_KEY
    delete process.env.RESEND_API_KEY
    await expect(mailer.send({
      kind: 'invite',
      to: recipient,
      subject: 'Join PlanningPal',
      text: 'Confirm your account in Supabase. This invite is only logged.',
    })).resolves.toBeUndefined()
    const rows = await db.select().from(mailLog).where(eq(mailLog.recipient, recipient))
    expect(rows.length).toBeGreaterThan(0)
    if (previous === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = previous
  })
})
