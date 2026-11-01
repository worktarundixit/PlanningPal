import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { magicLink } from 'better-auth/plugins'
import { db } from '../db/client.ts'
import { authAccount, authSession, authUser, authVerification } from '../db/schema.ts'
import { appOrigin, mailer } from './mailer.ts'
import { provisionDomainUser } from './provision.ts'

const googleId = process.env.GOOGLE_CLIENT_ID
const googleSecret = process.env.GOOGLE_CLIENT_SECRET
const microsoftId = process.env.MICROSOFT_CLIENT_ID
const microsoftSecret = process.env.MICROSOFT_CLIENT_SECRET

export const oauthProviders = {
  google: Boolean(googleId && googleSecret),
  microsoft: Boolean(microsoftId && microsoftSecret),
}

function trustedOrigins() {
  const origins = [
    appOrigin(),
    process.env.BETTER_AUTH_URL,
    'http://127.0.0.1:5173',
    'http://localhost:5173',
    'http://127.0.0.1:3001',
    'http://localhost:3001',
  ].filter((value): value is string => Boolean(value))
  return [...new Set(origins.map((value) => value.replace(/\/$/, '')))]
}

function createAuth() {
  return betterAuth({
    appName: 'PlanningPal',
    baseURL: process.env.BETTER_AUTH_URL || 'http://127.0.0.1:3001',
    basePath: '/api/auth',
    secret: process.env.BETTER_AUTH_SECRET || 'dev-planningpal-auth-secret',
    trustedOrigins: trustedOrigins(),
    rateLimit: {
      enabled: !process.env.VITEST,
    },
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: authUser,
        session: authSession,
        account: authAccount,
        verification: authVerification,
      },
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        await mailer.send({
          kind: 'reset-password',
          to: user.email,
          subject: 'Reset your PlanningPal password',
          text: `Open this link to choose a new password:\n${url}`,
        })
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await mailer.send({
          kind: 'verify-email',
          to: user.email,
          subject: 'Verify your PlanningPal email',
          text: `Confirm this address to finish creating your PlanningPal account:\n${url}`,
        })
      },
    },
    socialProviders: {
      ...(oauthProviders.google ? { google: { clientId: googleId!, clientSecret: googleSecret! } } : {}),
      ...(oauthProviders.microsoft
        ? {
            microsoft: {
              clientId: microsoftId!,
              clientSecret: microsoftSecret!,
              tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
            },
          }
        : {}),
    },
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await mailer.send({
            kind: 'magic-link',
            to: email,
            subject: 'Your PlanningPal sign-in link',
            text: `This link signs you in and expires shortly:\n${url}`,
          })
        },
      }),
    ],
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await provisionDomainUser({ id: user.id, email: user.email, name: user.name })
          },
        },
      },
    },
  })
}

type Auth = ReturnType<typeof createAuth>

let cached: Auth | undefined

export function getAuth(): Auth {
  cached ??= createAuth()
  return cached
}
