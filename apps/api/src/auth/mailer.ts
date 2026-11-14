import { alertDue } from '@planningpal/shared'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../db/client.ts'
import { organisations, users } from '../db/schema.ts'
import { mailLog } from '../db/schema.ts'

export type MailMessage = {
  to: string
  subject: string
  text: string
  kind: 'invite' | 'lead-alert'
}

/**
 * Product email (invites and new-lead alerts). Auth mail stays in Supabase.
 * Resend is used when RESEND_API_KEY is set. Otherwise the message is logged.
 */
export interface Mailer {
  send(message: MailMessage): Promise<void>
}

async function sendWithResend(message: MailMessage) {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) {
    console.warn(`[mail] RESEND_API_KEY is not set. Cannot send email to ${message.to}.`)
    return false
  }
  const customFrom = process.env.RESEND_FROM?.trim()
  // Try customFrom first if set, then fallback to onboarding@resend.dev which works on all Resend accounts without domain verification
  const fromAddresses = [
    ...(customFrom ? [customFrom] : []),
    'PlanningPal <onboarding@resend.dev>',
    'PlanningPal <alerts@planningpal.co.uk>',
  ]

  for (const from of fromAddresses) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [message.to], subject: message.subject, text: message.text }),
      })
      if (response.ok) {
        return true
      }
      const errBody = await response.text().catch(() => '')
      console.warn(`Resend rejected attempt with from=${from} (${response.status}): ${errBody}`)
    } catch (error) {
      console.error(`Resend request error with from=${from}:`, error instanceof Error ? error.message : error)
    }
  }
  return false
}

export function createMailer(): Mailer {
  return {
    async send(message) {
      const delivered = await sendWithResend(message)
      const line = `[mail:${message.kind}] to ${message.to} — ${message.subject}${delivered ? ' (resend)' : ' (logged)'}\n${message.text}`
      console.info(line)
      await db.insert(mailLog).values({
        kind: message.kind,
        recipient: message.to,
        subject: message.subject,
        body: message.text,
      })
    },
  }
}

export const mailer = createMailer()

export function appOrigin() {
  if (process.env.WEB_ORIGIN) {
    const origins = process.env.WEB_ORIGIN.split(',')
      .map((value) => value.trim().replace(/\/$/, ''))
      .filter(Boolean)
    const preferred = origins.find((value) => value.includes('://app.')) ?? origins[0]
    if (preferred) return preferred
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '')
  return process.env.NODE_ENV === 'production' ? 'https://app.planningpal.io' : 'http://127.0.0.1:5173'
}

/** Tell owners and admins, at the frequency they chose, that new schemes were stored. */
export async function notifyNewLeads(inserted: number, titles: string[]) {
  if (inserted < 1) return
  const recipients = await db
    .select({ email: users.email, frequency: users.alertFrequency })
    .from(users)
    .innerJoin(organisations, eq(users.organisationId, organisations.id))
    .where(and(eq(organisations.signalAlerts, true), eq(users.alertsEnabled, true), inArray(users.orgRole, ['owner', 'admin'])))
  const history = await db
    .select({ recipient: mailLog.recipient, createdAt: mailLog.createdAt })
    .from(mailLog)
    .where(eq(mailLog.kind, 'lead-alert'))
  const lastSent = new Map<string, Date>()
  for (const row of history) {
    const previous = lastSent.get(row.recipient)
    if (!previous || row.createdAt > previous) lastSent.set(row.recipient, row.createdAt)
  }
  const seen = new Set<string>()
  const sample = titles.filter(Boolean).slice(0, 8)
  const now = new Date()
  for (const recipient of recipients) {
    if (!recipient.email || seen.has(recipient.email)) continue
    if (!alertDue(recipient.frequency, lastSent.get(recipient.email) ?? null, now)) continue
    seen.add(recipient.email)
    await mailer.send({
      kind: 'lead-alert',
      to: recipient.email,
      subject: `${inserted} new planning ${inserted === 1 ? 'lead' : 'leads'}`,
      text: [`PlanningPal stored ${inserted} new scheme${inserted === 1 ? '' : 's'}.`, '', ...sample].join('\n'),
    })
  }
}
