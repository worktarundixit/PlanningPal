import { and, eq } from 'drizzle-orm'
import type { FastifyRequest } from 'fastify'
import { db } from '../db/client.ts'
import { auditLog, customRoles, organisations, users, workspaceMembers } from '../db/schema.ts'
import type { AuthUser } from '../types.ts'
import { parseOrgRole, permissionsFor, type OrgRole, type PlatformRole } from './permissions.ts'
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
  let orgRole = (row.user.orgRole as OrgRole | null) ?? null
  let customRolePermissions: string[] | undefined
  if (organisationId) {
    const [membership] = await db
      .select()
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, organisationId), eq(workspaceMembers.authUserId, authUserId)))
      .limit(1)
    if (membership && membership.role !== 'owner' && membership.role !== 'admin' && membership.role !== 'member' && membership.role !== 'viewer') {
      orgRole = null
    } else if (membership) {
      orgRole = membership.role as OrgRole
    }
    if (orgRole && !parseOrgRole(orgRole)) {
      const [custom] = await db
        .select()
        .from(customRoles)
        .where(and(eq(customRoles.organisationId, organisationId), eq(customRoles.name, String(orgRole))))
        .limit(1)
      if (custom) {
        customRolePermissions = custom.permissions
      } else {
        orgRole = null
      }
    }
  }
  if (row.user.platformRole === 'super_admin') {
    const requested = headerValue(request.headers['x-workspace-id']) || headerValue(request.headers['x-organisation-id'])
    if (requested) {
      const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requested)
      const [chosen] = uuidLike
        ? await db.select().from(organisations).where(eq(organisations.id, requested)).limit(1)
        : [undefined]
      const [bySlug] = chosen ? [chosen] : await db.select().from(organisations).where(eq(organisations.slug, requested)).limit(1)
      if (!bySlug) {
        request.missingWorkspace = true
        return null
      }
      organisationId = bySlug.id
      companyName = bySlug.companyName
      const [targetMembership] = await db
        .select()
        .from(workspaceMembers)
        .where(and(eq(workspaceMembers.workspaceId, bySlug.id), eq(workspaceMembers.authUserId, authUserId)))
        .limit(1)
      orgRole =
        targetMembership &&
        (targetMembership.role === 'owner' || targetMembership.role === 'admin' || targetMembership.role === 'member' || targetMembership.role === 'viewer')
          ? targetMembership.role
          : null
      await db.insert(auditLog).values({
        actorUserId: row.user.id,
        workspaceId: bySlug.id,
        action: 'staff.workspace.access',
        method: request.method,
        path: request.url.split('?')[0] || request.url,
      })
    }
  }
  const previewRole = headerValue(request.headers['x-preview-role'])?.trim()
  let platformRole = row.user.platformRole === 'super_admin' ? ('super_admin' as PlatformRole) : null
  if (previewRole && (platformRole === 'super_admin' || orgRole === 'owner' || orgRole === 'admin')) {
    const parsedPreview = parseOrgRole(previewRole)
    if (parsedPreview) {
      orgRole = parsedPreview
      platformRole = null
      customRolePermissions = undefined
    } else if (organisationId) {
      const [custom] = await db
        .select()
        .from(customRoles)
        .where(and(eq(customRoles.organisationId, organisationId), eq(customRoles.name, previewRole)))
        .limit(1)
      if (custom) {
        orgRole = custom.name as OrgRole
        platformRole = null
        customRolePermissions = custom.permissions
      }
    }
  }
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
    permissions: permissionsFor(orgRole, platformRole, customRolePermissions),
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
