import { asc, eq, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/client.ts'
import {
  clients,
  customRoles,
  demoRequests,
  intentEvents,
  invoices,
  meetings,
  personaTemplates,
  planningApplications,
  savedSchemes,
  teamMembers,
  users,
} from '../db/schema.ts'
import { parseBody, requireUser } from '../lib/http.ts'

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
    const [client] = await db.select().from(clients).where(eq(clients.id, user.clientId)).limit(1)
    return {
      id: user.id,
      name: user.name,
      role: user.jobTitle,
      company: user.companyName,
      email: user.email,
      twoFactorEnabled: user.twoFactorEnabled,
      plan: client?.planName ?? 'Team Plan',
      tier: client?.tier ?? 'CATEGORY_3',
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
    await db.update(clients).set({ companyName: body.company }).where(eq(clients.id, user.clientId))
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
    const [client] = await db.select().from(clients).where(eq(clients.id, user.clientId)).limit(1)
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
    const events = await db.select().from(intentEvents).where(eq(intentEvents.clientId, user.clientId)).orderBy(asc(intentEvents.createdAt))
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
    const [client] = await db.select().from(clients).where(eq(clients.id, user.clientId)).limit(1)
    const snapshot = (client?.portalSnapshot ?? {}) as { reports?: unknown }
    return snapshot.reports ?? {}
  })

  app.get('/api/v1/delivery', async (request) => {
    const user = requireUser(request)
    const [client] = await db.select().from(clients).where(eq(clients.id, user.clientId)).limit(1)
    const snapshot = (client?.portalSnapshot ?? {}) as { delivery?: unknown }
    const rows = await db.select().from(meetings).where(eq(meetings.clientId, user.clientId)).orderBy(asc(meetings.createdAt))
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
    const [client] = await db.select().from(clients).where(eq(clients.id, user.clientId)).limit(1)
    const rows = await db.select().from(invoices).where(eq(invoices.clientId, user.clientId)).orderBy(asc(invoices.issuedOn))
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

  app.get('/api/v1/workspace', async (request) => {
    const user = requireUser(request)
    const [client] = await db.select().from(clients).where(eq(clients.id, user.clientId)).limit(1)
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
      .update(clients)
      .set({
        ...(body.territories ? { targetTerritories: body.territories } : {}),
        ...(body.trades ? { tradeSpecialisms: body.trades } : {}),
        ...(body.radius !== undefined ? { operatingRadiusMiles: body.radius } : {}),
        ...(body.signalAlerts !== undefined ? { signalAlerts: body.signalAlerts } : {}),
      })
      .where(eq(clients.id, user.clientId))
      .returning()
    return {
      territories: updated?.targetTerritories ?? [],
      trades: updated?.tradeSpecialisms ?? [],
      radius: updated?.operatingRadiusMiles,
      signalAlerts: updated?.signalAlerts,
    }
  })

  app.get('/api/v1/team', async (request) => {
    const user = requireUser(request)
    const members = await db.select().from(teamMembers).where(eq(teamMembers.clientId, user.clientId)).orderBy(asc(teamMembers.createdAt))
    const roles = await db.select().from(customRoles).where(eq(customRoles.clientId, user.clientId)).orderBy(asc(customRoles.createdAt))
    return {
      members: members.map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        status: member.status,
      })),
      customRoles: roles.map((role) => ({ id: role.id, name: role.name, permissions: role.permissions })),
    }
  })

  app.post('/api/v1/team/invites', async (request, reply) => {
    const user = requireUser(request)
    const body = parseBody(z.object({ email: z.string().email(), role: z.string().min(1) }), request.body, reply)
    if (!body) return
    const name = body.email
      .split('@')[0]
      ?.split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
    const [created] = await db
      .insert(teamMembers)
      .values({ clientId: user.clientId, name: name || 'Invited member', email: body.email, role: body.role, status: 'Pending' })
      .returning()
    return reply.code(201).send({
      id: created?.id,
      name: created?.name,
      email: created?.email,
      role: created?.role,
      status: created?.status,
    })
  })

  app.patch('/api/v1/team/:id', async (request, reply) => {
    const user = requireUser(request)
    const { id } = request.params as { id: string }
    const body = parseBody(z.object({ role: z.string().min(1) }), request.body, reply)
    if (!body) return
    const [existing] = await db.select().from(teamMembers).where(eq(teamMembers.id, id)).limit(1)
    if (!existing || existing.clientId !== user.clientId) return reply.code(404).send({ error: 'Team member not found' })
    if (existing.role === 'Owner') return reply.code(400).send({ error: 'The owner role cannot be changed' })
    const [updated] = await db.update(teamMembers).set({ role: body.role }).where(eq(teamMembers.id, id)).returning()
    return { id: updated?.id, role: updated?.role }
  })

  app.delete('/api/v1/team/:id', async (request, reply) => {
    const user = requireUser(request)
    const { id } = request.params as { id: string }
    const [existing] = await db.select().from(teamMembers).where(eq(teamMembers.id, id)).limit(1)
    if (!existing || existing.clientId !== user.clientId) return reply.code(404).send({ error: 'Team member not found' })
    if (existing.role === 'Owner') return reply.code(400).send({ error: 'The owner cannot be removed' })
    await db.delete(teamMembers).where(eq(teamMembers.id, id))
    return { id, removed: true }
  })

  app.post('/api/v1/roles', async (request, reply) => {
    const user = requireUser(request)
    const body = parseBody(z.object({ name: z.string().min(1), permissions: z.array(z.string()).min(1) }), request.body, reply)
    if (!body) return
    const [created] = await db
      .insert(customRoles)
      .values({ clientId: user.clientId, name: body.name.trim(), permissions: body.permissions })
      .returning()
    return reply.code(201).send({ id: created?.id, name: created?.name, permissions: created?.permissions })
  })

  app.get('/api/v1/persona', async (request) => {
    const user = requireUser(request)
    const [persona] = await db.select().from(personaTemplates).where(eq(personaTemplates.clientId, user.clientId)).limit(1)
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
    const [existing] = await db.select().from(personaTemplates).where(eq(personaTemplates.clientId, user.clientId)).limit(1)
    if (!existing) {
      const [created] = await db
        .insert(personaTemplates)
        .values({ clientId: user.clientId, stakeholder: body.stakeholder, angle: body.angle, proofPoints: body.proofPoints ?? [] })
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
