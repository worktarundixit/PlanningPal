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
  const key = process.env.RESEND_API_KEY
  if (!key) return false
  const from = process.env.RESEND_FROM || 'PlanningPal <alerts@planningpal.co.uk>'
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [message.to], subject: message.subject, text: message.text }),
  })
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Resend rejected the message (${response.status}): ${detail.slice(0, 200)}`)
  }
  return true
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
  return (process.env.WEB_ORIGIN || 'http://127.0.0.1:5173').replace(/\/$/, '')
}

/** Tell owners and admins in alert-enabled organisations that new schemes were stored. */
export async function notifyNewLeads(inserted: number, titles: string[]) {
  if (inserted < 1) return
  const recipients = await db
    .select({ email: users.email })
    .from(users)
    .innerJoin(organisations, eq(users.organisationId, organisations.id))
    .where(and(eq(organisations.signalAlerts, true), inArray(users.orgRole, ['owner', 'admin'])))
  const seen = new Set<string>()
  const sample = titles.filter(Boolean).slice(0, 8)
  for (const recipient of recipients) {
    if (!recipient.email || seen.has(recipient.email)) continue
    seen.add(recipient.email)
    await mailer.send({
      kind: 'lead-alert',
      to: recipient.email,
      subject: `${inserted} new planning ${inserted === 1 ? 'lead' : 'leads'}`,
      text: [`PlanningPal stored ${inserted} new scheme${inserted === 1 ? '' : 's'}.`, '', ...sample].join('\n'),
    })
  }
}
