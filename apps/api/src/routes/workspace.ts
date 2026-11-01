import { and, asc, eq, isNull, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { appOrigin, mailer } from '../auth/mailer.ts'
import { parseOrgRole, roleLabel } from '../auth/permissions.ts'
import { db } from '../db/client.ts'
import {
  customRoles,
  demoRequests,
  intentEvents,
  invitations,
  invoices,
  meetings,
  organisations,
  personaTemplates,
  planningApplications,
  savedSchemes,
  teamMembers,
  users,
} from '../db/schema.ts'
import { HttpError, parseBody, requireUser } from '../lib/http.ts'

const profileBody = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  company: z.string().min(1),
  email: z.string().email(),
  twoFactorEnabled: z.boolean().optional(),
})

const workspaceBody = z.object({
  territories: z.array(z.string()).optional(),
  trades: z.array(z.string()).optional(),
  radius: z.number().int().min(5).max(100).optional(),
  signalAlerts: z.boolean().optional(),
})

const demoBody = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().min(1),
  trade: z.string().default(''),
  note: z.string().default(''),
})

export async function workspaceRoutes(app: FastifyInstance) {
  app.post('/api/v1/demo-requests', { config: { public: true } }, async (request, reply) => {
    const body = parseBody(demoBody, request.body, reply)
    if (!body) return
    const [created] = await db.insert(demoRequests).values(body).returning({ id: demoRequests.id })
    return reply.code(201).send({ id: created?.id, received: true })
  })

  app.get('/api/v1/me', async (request) => {
    const user = requireUser(request)
    const [client] = await db.select().from(organisations).where(eq(organisations.id, user.organisationId)).limit(1)
    return {
      id: user.id,
      name: user.name,
      role: user.jobTitle,
      company: user.companyName,
      email: user.email,
      twoFactorEnabled: user.twoFactorEnabled,
      plan: client?.planName ?? 'Team Plan',
      tier: client?.tier ?? 'CATEGORY_3',
      organisationId: user.organisationId || null,
      orgRole: user.orgRole,
      orgRoleLabel: user.platformRole === 'super_admin' ? 'Super Admin' : user.orgRole ? roleLabel(user.orgRole) : '',
      platformRole: user.platformRole,
      permissions: user.permissions,
    }
  })

  app.patch('/api/v1/me', async (request, reply) => {
    const user = requireUser(request)
    const body = parseBody(profileBody, request.body, reply)
    if (!body) return
    const [updated] = await db
      .update(users)
      .set({
        name: body.name,
        jobTitle: body.role,
        email: body.email,
        twoFactorEnabled: body.twoFactorEnabled ?? user.twoFactorEnabled,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning()
    if (user.organisationId && user.permissions.includes('settings.write')) {
      await db.update(organisations).set({ companyName: body.company }).where(eq(organisations.id, user.organisationId))
    }
    await db.update(teamMembers).set({ name: body.name, email: body.email }).where(eq(teamMembers.userId, user.id))
    return {
      name: updated?.name,
      role: updated?.jobTitle,
      company: body.company,
      email: updated?.email,
      twoFactorEnabled: updated?.twoFactorEnabled,
    }
  })

  app.get('/api/v1/overview', async (request) => {
    const user = requireUser(request)
    const [client] = await db.select().from(organisations).where(eq(organisations.id, user.organisationId)).limit(1)
    const [counts] = await db
      .select({
        schemes: sql<number>`count(*)::int`,
        withContact: sql<number>`count(*) FILTER (WHERE architect_agent_email <> '' OR architect_agent_phone <> '')::int`,
      })
      .from(planningApplications)
    const [saved] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(savedSchemes)
      .where(eq(savedSchemes.userId, user.id))
    const events = await db.select().from(intentEvents).where(eq(intentEvents.organisationId, user.organisationId)).orderBy(asc(intentEvents.createdAt))
    const snapshot = (client?.portalSnapshot ?? {}) as Record<string, unknown>
    return {
      schemes: counts?.schemes ?? 0,
      contactsFound: counts?.withContact ?? 0,
      saved: saved?.total ?? 0,
      metrics: snapshot,
      intent: events.map((event) => ({
        id: event.id,
        initials: event.actorInitials,
        name: event.actorName,
        action: event.action,
        detail: event.detail,
        time: event.timeLabel,
        hot: event.hot,
      })),
    }
  })

  app.get('/api/v1/reports', async (request) => {
    const user = requireUser(request)
    const [client] = await db.select().from(organisations).where(eq(organisations.id, user.organisationId)).limit(1)
    const snapshot = (client?.portalSnapshot ?? {}) as { reports?: unknown }
    return snapshot.reports ?? {}
  })

  app.get('/api/v1/delivery', async (request) => {
    const user = requireUser(request)
    const [client] = await db.select().from(organisations).where(eq(organisations.id, user.organisationId)).limit(1)
    const snapshot = (client?.portalSnapshot ?? {}) as { delivery?: unknown }
    const rows = await db.select().from(meetings).where(eq(meetings.organisationId, user.organisationId)).orderBy(asc(meetings.createdAt))
    return {
      ...(snapshot.delivery as object),
      meetings: rows.map((meeting) => ({
        when: meeting.whenLabel,
        firm: meeting.firm,
        scheme: meeting.scheme,
        kind: meeting.kind,
      })),
    }
  })

  app.get('/api/v1/billing', async (request) => {
    const user = requireUser(request)
    const [client] = await db.select().from(organisations).where(eq(organisations.id, user.organisationId)).limit(1)
    const rows = await db.select().from(invoices).where(eq(invoices.organisationId, user.organisationId)).orderBy(asc(invoices.issuedOn))
    const snapshot = (client?.portalSnapshot ?? {}) as { billing?: unknown }
    return {
      plan: client?.planName,
      price: client?.monthlyPrice,
      company: client?.companyName,
      ...(snapshot.billing as object),
      invoices: rows.map((invoice) => ({
        date: invoice.issuedOn,
        number: invoice.number,
        amount: invoice.amount,
        status: invoice.status,
      })),
    }
  })

  app.get('/api/v1/workspaces/:id', async (request, reply) => {
    const user = requireUser(request)
    const { id } = request.params as { id: string }
    if (id !== user.organisationId) return reply.code(404).send({ error: 'Not found' })
    return { id: user.organisationId, name: user.companyName, role: user.orgRole }
  })

  app.delete('/api/v1/workspaces/:id', async (request, reply) => {
    const user = requireUser(request)
    const { id } = request.params as { id: string }
    if (id !== user.organisationId) return reply.code(404).send({ error: 'Not found' })
    if (user.platformRole !== 'super_admin' && user.orgRole !== 'owner') return reply.code(403).send({ error: 'Forbidden' })
    await db.delete(organisations).where(eq(organisations.id, id))
    return { deleted: true }
  })

  app.get('/api/v1/workspace', async (request) => {
    const user = requireUser(request)
    const [client] = await db.select().from(organisations).where(eq(organisations.id, user.organisationId)).limit(1)
    return {
      territories: client?.targetTerritories ?? [],
      trades: client?.tradeSpecialisms ?? [],
      radius: client?.operatingRadiusMiles ?? 25,
      signalAlerts: client?.signalAlerts ?? true,
      planPrice: 2950,
    }
  })

  app.patch('/api/v1/workspace', async (request, reply) => {
    const user = requireUser(request)
    const body = parseBody(workspaceBody, request.body, reply)
    if (!body) return
    const [updated] = await db
      .update(organisations)
      .set({
        ...(body.territories ? { targetTerritories: body.territories } : {}),
        ...(body.trades ? { tradeSpecialisms: body.trades } : {}),
        ...(body.radius !== undefined ? { operatingRadiusMiles: body.radius } : {}),
        ...(body.signalAlerts !== undefined ? { signalAlerts: body.signalAlerts } : {}),
      })
      .where(eq(organisations.id, user.organisationId))
      .returning()
    return {
      territories: updated?.targetTerritories ?? [],
      trades: updated?.tradeSpecialisms ?? [],
      radius: updated?.operatingRadiusMiles,
      signalAlerts: updated?.signalAlerts,
    }
  })

  app.get('/api/v1/team/invites/:token', { config: { public: true } }, async (request, reply) => {
    const { token } = request.params as { token: string }
    const [invite] = await db
      .select({
        email: invitations.email,
        role: invitations.role,
        expiresAt: invitations.expiresAt,
        acceptedAt: invitations.acceptedAt,
        companyName: organisations.companyName,
      })
      .from(invitations)
      .innerJoin(organisations, eq(invitations.organisationId, organisations.id))
      .where(eq(invitations.token, token))
      .limit(1)
    if (!invite || invite.acceptedAt) return reply.code(404).send({ error: 'Invitation not found' })
    return {
      email: invite.email,
      role: roleLabel(invite.role),
      organisation: invite.companyName,
      expired: invite.expiresAt.getTime() < Date.now(),
    }
  })

  app.get('/api/v1/team', async (request) => {
    const user = requireUser(request)
    const members = await db.select().from(teamMembers).where(eq(teamMembers.organisationId, user.organisationId)).orderBy(asc(teamMembers.createdAt))
    const roles = user.organisationId
      ? await db.select().from(customRoles).where(eq(customRoles.organisationId, user.organisationId)).orderBy(asc(customRoles.createdAt))
      : []
    return {
      members: members.map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        role: roleLabel(member.role),
        status: member.status === 'Active' ? 'Active' : 'Pending',
      })),
      customRoles: roles.map((role) => ({ id: role.id, name: role.name, permissions: role.permissions })),
    }
  })

  app.post('/api/v1/team/invites', async (request, reply) => {
    const user = requireUser(request)
    if (!user.organisationId) throw new HttpError(403, 'No organisation selected')
    const body = parseBody(z.object({ email: z.string().email(), role: z.string().min(1) }), request.body, reply)
    if (!body) return
    const parsed = parseOrgRole(body.role)
    const custom = !parsed && user.organisationId
      ? (await db.select().from(customRoles).where(and(eq(customRoles.organisationId, user.organisationId), eq(customRoles.name, body.role.trim()))).limit(1))[0]
      : undefined
    if (parsed === 'owner' || (!parsed && !custom)) return reply.code(400).send({ error: 'Choose Admin, Member, or Viewer' })
    const role = parsed ?? custom!.name
    const email = body.email.toLowerCase()
    const [already] = await db
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(and(eq(teamMembers.organisationId, user.organisationId), eq(teamMembers.email, email)))
      .limit(1)
    if (already) return reply.code(409).send({ error: 'That email is already on the team' })
    const token = randomBytes(24).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const name = email
      .split('@')[0]
      ?.split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
    const inviteUrl = `${appOrigin()}/accept-invite?token=${token}`
    const [created] = await db
      .insert(teamMembers)
      .values({ organisationId: user.organisationId, name: name || 'Invited member', email, role, status: 'Pending' })
      .returning()
    await db.insert(invitations).values({
      organisationId: user.organisationId,
      email,
      role,
      token,
      expiresAt,
      invitedBy: user.id,
    })
    await mailer.send({
      kind: 'invite',
      to: email,
      subject: `Join ${user.companyName} on PlanningPal`,
      text: `${user.name} invited you to ${user.companyName} as ${roleLabel(role)}.\nOpen this link to create your account:\n${inviteUrl}`,
    })
    return reply.code(201).send({
      id: created?.id,
      name: created?.name,
      email: created?.email,
      role: roleLabel(role),
      status: 'Pending',
      inviteUrl,
    })
  })

  app.patch('/api/v1/team/:id', async (request, reply) => {
    const user = requireUser(request)
    const { id } = request.params as { id: string }
    const body = parseBody(z.object({ role: z.string().min(1) }), request.body, reply)
    if (!body) return
    const parsed = parseOrgRole(body.role)
    const custom = !parsed
      ? (await db.select().from(customRoles).where(and(eq(customRoles.organisationId, user.organisationId), eq(customRoles.name, body.role.trim()))).limit(1))[0]
      : undefined
    if (!parsed && !custom) return reply.code(400).send({ error: 'Unknown role' })
    const role = parsed ?? custom!.name
    const [existing] = await db.select().from(teamMembers).where(eq(teamMembers.id, id)).limit(1)
    if (!existing || existing.organisationId !== user.organisationId) return reply.code(404).send({ error: 'Team member not found' })
    if (existing.userId === user.id) return reply.code(403).send({ error: 'You cannot change your own role' })
    if (parseOrgRole(existing.role) === 'owner') {
      const owners = await db
        .select({ id: teamMembers.id })
        .from(teamMembers)
        .where(and(eq(teamMembers.organisationId, user.organisationId), eq(teamMembers.role, 'owner')))
      if (owners.length <= 1) return reply.code(403).send({ error: 'The last owner cannot be changed' })
      return reply.code(403).send({ error: 'The owner role cannot be changed' })
    }
    if (role === 'owner' && user.platformRole !== 'super_admin' && user.orgRole !== 'owner') {
      return reply.code(403).send({ error: 'Only an owner can assign the owner role' })
    }
    if (user.orgRole === 'admin' && role === 'owner') return reply.code(403).send({ error: 'Admins cannot assign the owner role' })
    const [updated] = await db.update(teamMembers).set({ role }).where(eq(teamMembers.id, id)).returning()
    if (existing.userId && parsed) await db.update(users).set({ orgRole: parsed, updatedAt: new Date() }).where(eq(users.id, existing.userId))
    return { id: updated?.id, role: updated ? roleLabel(updated.role) : roleLabel(role) }
  })

  app.delete('/api/v1/team/:id', async (request, reply) => {
    const user = requireUser(request)
    const { id } = request.params as { id: string }
    const [existing] = await db.select().from(teamMembers).where(eq(teamMembers.id, id)).limit(1)
    if (!existing || existing.organisationId !== user.organisationId) return reply.code(404).send({ error: 'Team member not found' })
    if (parseOrgRole(existing.role) === 'owner') {
      const owners = await db
        .select({ id: teamMembers.id })
        .from(teamMembers)
        .where(and(eq(teamMembers.organisationId, user.organisationId), eq(teamMembers.role, 'owner')))
      if (owners.length <= 1) return reply.code(403).send({ error: 'The last owner cannot be removed' })
      return reply.code(403).send({ error: 'The owner cannot be removed' })
    }
    if (user.orgRole === 'admin' && parseOrgRole(existing.role) === 'admin' && existing.userId === user.id) {
      return reply.code(403).send({ error: 'Ask an owner to remove your admin seat' })
    }
    if (existing.userId) {
      await db.update(users).set({ organisationId: null, updatedAt: new Date() }).where(eq(users.id, existing.userId))
    }
    await db
      .update(invitations)
      .set({ acceptedAt: new Date() })
      .where(and(eq(invitations.organisationId, existing.organisationId), eq(invitations.email, existing.email), isNull(invitations.acceptedAt)))
    await db.delete(teamMembers).where(eq(teamMembers.id, id))
    return { id, removed: true }
  })

  app.post('/api/v1/roles', async (request, reply) => {
    const user = requireUser(request)
    if (!user.organisationId) throw new HttpError(403, 'No organisation selected')
    const body = parseBody(z.object({ name: z.string().min(1), permissions: z.array(z.string()).min(1) }), request.body, reply)
    if (!body) return
    const name = body.name.trim()
    if (parseOrgRole(name)) return reply.code(409).send({ error: 'That name is already a workspace role' })
    const [existing] = await db
      .select({ id: customRoles.id })
      .from(customRoles)
      .where(and(eq(customRoles.organisationId, user.organisationId), eq(customRoles.name, name)))
      .limit(1)
    if (existing) return reply.code(409).send({ error: 'That role already exists' })
    const [created] = await db
      .insert(customRoles)
      .values({ organisationId: user.organisationId, name, permissions: body.permissions })
      .returning()
    return reply.code(201).send({ id: created?.id, name: created?.name, permissions: created?.permissions ?? [] })
  })

  app.get('/api/v1/persona', async (request) => {
    const user = requireUser(request)
    const [persona] = await db.select().from(personaTemplates).where(eq(personaTemplates.organisationId, user.organisationId)).limit(1)
    return {
      stakeholder: persona?.stakeholder ?? 'Lead architect',
      angle: persona?.angle ?? '',
      proofPoints: persona?.proofPoints ?? [],
    }
  })

  app.put('/api/v1/persona', async (request, reply) => {
    const user = requireUser(request)
    const body = parseBody(
      z.object({
        stakeholder: z.string().min(1),
        angle: z.string().min(1),
        proofPoints: z.array(z.string()).optional(),
      }),
      request.body,
      reply,
    )
    if (!body) return
    const [existing] = await db.select().from(personaTemplates).where(eq(personaTemplates.organisationId, user.organisationId)).limit(1)
    if (!existing) {
      const [created] = await db
        .insert(personaTemplates)
        .values({ organisationId: user.organisationId, stakeholder: body.stakeholder, angle: body.angle, proofPoints: body.proofPoints ?? [] })
        .returning()
      return { stakeholder: created?.stakeholder, angle: created?.angle, proofPoints: created?.proofPoints }
    }
    const [updated] = await db
      .update(personaTemplates)
      .set({ stakeholder: body.stakeholder, angle: body.angle, proofPoints: body.proofPoints ?? existing.proofPoints, updatedAt: new Date() })
      .where(eq(personaTemplates.id, existing.id))
      .returning()
    return { stakeholder: updated?.stakeholder, angle: updated?.angle, proofPoints: updated?.proofPoints }
  })
}
