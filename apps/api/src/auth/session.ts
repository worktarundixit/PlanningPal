import { asc, eq } from 'drizzle-orm'
import type { FastifyRequest } from 'fastify'
import { db } from '../db/client.ts'
import { organisations, users } from '../db/schema.ts'
import type { AuthUser } from '../types.ts'
import { getAuth } from './auth.ts'
import { permissionsFor, type OrgRole, type PlatformRole } from './permissions.ts'

function headerValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export async function loadSession(request: FastifyRequest): Promise<AuthUser | null> {
  const headers = new Headers()
  for (const [key, value] of Object.entries(request.headers)) {
    const text = headerValue(value)
    if (text) headers.set(key, text)
  }
  const session = await getAuth().api.getSession({ headers })
  if (!session?.user) return null

  const [row] = await db
    .select({ user: users, companyName: organisations.companyName })
    .from(users)
    .leftJoin(organisations, eq(users.organisationId, organisations.id))
    .where(eq(users.authUserId, session.user.id))
    .limit(1)
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
    authUserId: session.user.id,
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
