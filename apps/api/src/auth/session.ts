import { asc, eq } from 'drizzle-orm'
import type { FastifyRequest } from 'fastify'
import { db } from '../db/client.ts'
import { organisations, users } from '../db/schema.ts'
import type { AuthUser } from '../types.ts'
import { permissionsFor, type OrgRole, type PlatformRole } from './permissions.ts'
import { provisionDomainUser } from './provision.ts'
import { userFromAccessToken } from './supabase.ts'

function headerValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

async function presentUser(request: FastifyRequest, authUserId: string, email: string, name: string): Promise<AuthUser | null> {
  let [row] = await db
    .select({ user: users, companyName: organisations.companyName })
    .from(users)
    .leftJoin(organisations, eq(users.organisationId, organisations.id))
    .where(eq(users.authUserId, authUserId))
    .limit(1)
  if (!row) {
    await provisionDomainUser({ id: authUserId, email, name })
    ;[row] = await db
      .select({ user: users, companyName: organisations.companyName })
      .from(users)
      .leftJoin(organisations, eq(users.organisationId, organisations.id))
      .where(eq(users.authUserId, authUserId))
      .limit(1)
  }
  if (!row) return null

  let organisationId = row.user.organisationId
  let companyName = row.companyName ?? (row.user.platformRole === 'super_admin' ? 'Hitcaliber Ltd' : '')
  if (row.user.platformRole === 'super_admin') {
    const requested = headerValue(request.headers['x-organisation-id'])
    if (requested) {
      const [chosen] = await db.select().from(organisations).where(eq(organisations.id, requested)).limit(1)
      if (chosen) {
        organisationId = chosen.id
        companyName = chosen.companyName
      }
    } else if (!organisationId) {
      const [first] = await db.select().from(organisations).orderBy(asc(organisations.createdAt)).limit(1)
      if (first) {
        organisationId = first.id
        companyName = first.companyName
      }
    }
  }

  const orgRole = (row.user.orgRole as OrgRole | null) ?? null
  const platformRole = row.user.platformRole === 'super_admin' ? ('super_admin' as PlatformRole) : null
  return {
    id: row.user.id,
    authUserId,
    organisationId: organisationId ?? '',
    email: row.user.email,
    name: row.user.name,
    jobTitle: row.user.jobTitle,
    companyName,
    twoFactorEnabled: row.user.twoFactorEnabled,
    orgRole,
    platformRole,
    permissions: permissionsFor(orgRole, platformRole),
  }
}

/** Vitest-only identity. Production ignores this header. */
async function testUser(request: FastifyRequest): Promise<AuthUser | null> {
  if (process.env.VITEST !== 'true') return null
  const header = headerValue(request.headers['x-test-user'])
  const cookie = headerValue(request.headers.cookie) ?? ''
  const fromCookie = cookie.match(/(?:^|;\s*)x-test-user=([^;]+)/)?.[1]
  const email = (header || (fromCookie ? decodeURIComponent(fromCookie) : '')).toLowerCase()
  if (!email) return null
  const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!row?.authUserId) return null
  return presentUser(request, row.authUserId, row.email, row.name)
}

export async function loadSession(request: FastifyRequest): Promise<AuthUser | null> {
  const fromTest = await testUser(request)
  if (fromTest) return fromTest
  const header = headerValue(request.headers.authorization)
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : ''
  if (!token || token.startsWith('x-test-user')) return null
  const supabaseUser = await userFromAccessToken(token)
  if (!supabaseUser) return null
  return presentUser(request, supabaseUser.id, supabaseUser.email, supabaseUser.name)
}
