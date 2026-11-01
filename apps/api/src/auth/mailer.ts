import { db } from '../db/client.ts'
import { mailLog } from '../db/schema.ts'

export type MailMessage = {
  to: string
  subject: string
  text: string
  kind: 'verify-email' | 'reset-password' | 'magic-link' | 'invite'
}

/**
 * Outbound mail. The dev implementation writes the message to the log and to
 * mail_log so local sign-up, reset, magic-link, and invite links can be read
 * without an email provider.
 */
export interface Mailer {
  send(message: MailMessage): Promise<void>
}

export function createMailer(): Mailer {
  return {
    async send(message) {
      const line = `[mail:${message.kind}] to ${message.to} — ${message.subject}\n${message.text}`
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
  return (process.env.WEB_ORIGIN || process.env.BETTER_AUTH_URL || 'http://127.0.0.1:5173').replace(/\/$/, '')
}
