import { coverageChoice, councilsFor, UK_AREAS, validateIcp, type OnboardingStep } from '@planningpal/shared'
import { and, asc, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { appOrigin, mailer } from '../auth/mailer.ts'
import { roleLabel, type Permission } from '../auth/permissions.ts'
import { db } from '../db/client.ts'
import { auditLog, invitations, organisations, teamMembers, users } from '../db/schema.ts'
import { HttpError, parseBody, requireUser } from '../lib/http.ts'
import type { AuthUser } from '../types.ts'

const logoPattern = /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=\s]+$/i

const saveBody = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('save-workspace'),
    companyName: z.string().trim().min(2).max(120),
    logoUrl: z.string().max(180_000).optional(),
  }),
  z.object({
    action: z.literal('save-profile'),
    name: z.string().trim().min(1).max(80),
    jobTitle: z.string().trim().min(1).max(80),
  }),
  z.object({
    action: z.literal('save-icp'),
    coverage: z.enum(['regional', 'multi_county', 'nationwide']),
    regions: z.array(z.string()).max(12),
    councils: z.array(z.string()).max(48),
    projectTypes: z.array(z.string()).min(1).max(8),
    valueRanges: z.array(z.string()).min(1).max(4),
    ribaStages: z.array(z.string()).min(1).max(3),
  }),
  z.object({
    action: z.literal('save-team'),
    invites: z.array(z.object({ email: z.string().email(), role: z.enum(['admin', 'member', 'viewer']) })).max(10),
  }),
  z.object({
    action: z.literal('save-alerts'),
    enabled: z.boolean(),
    frequency: z.enum(['immediate', 'daily', 'weekly']),
  }),
  z.object({ action: z.literal('skip') }),
  z.object({ action: z.literal('back') }),
  z.object({ action: z.literal('dismiss-checklist') }),
])

type SaveBody = z.infer<typeof saveBody>

const STEP_LABEL: Record<Exclude<OnboardingStep, 'done'>, string> = {
  workspace: 'Workspace',
  profile: 'Profile',
  icp: 'Ideal projects',
  team: 'Teammates',
  alerts: 'Alerts',
}

function cleanLogo(value: string | undefined) {
  if (!value) return ''
  if (!logoPattern.test(value) || value.length > 180_000) {
    throw new HttpError(400, 'Logo must be a PNG, JPEG, or WebP image under 120KB')
  }
  return value
}

function slugify(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'workspace'
  return `${base}-${randomBytes(2).toString('hex')}`
}

function sequence(row: typeof users.$inferSelect, permissions: Permission[]) {
  const skipped = new Set(row.onboardingSkipped ?? [])
  const steps: Exclude<OnboardingStep, 'done'>[] = []
  if (!skipped.has('workspace')) steps.push('workspace')
  steps.push('profile')
  if (row.organisationId && permissions.includes('settings.write')) steps.push('icp')
  if (row.organisationId && permissions.includes('team.manage')) steps.push('team')
  steps.push('alerts')
  return steps
}

async function loadRow(userId: string) {
  const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!row) throw new HttpError(401, 'Unauthorized')
  return row
}

async function present(row: typeof users.$inferSelect, permissions: Permission[]) {
  const steps = sequence(row, permissions)
  const skipped = new Set(row.onboardingSkipped ?? [])
  const [client] = row.organisationId
    ? await db.select().from(organisations).where(eq(organisations.id, row.organisationId)).limit(1)
    : [undefined]
  const seats = row.organisationId
    ? await db.select({ id: teamMembers.id }).from(teamMembers).where(eq(teamMembers.organisationId, row.organisationId))
    : []
  const current = row.onboardingStep as OnboardingStep
  const cursor = current === 'done' ? steps.length : Math.max(0, steps.indexOf(current))
  return {
    step: current,
    invited: skipped.has('workspace'),
    steps: steps.map((id) => ({
      id,
      label: STEP_LABEL[id],
      optional: id === 'icp' || id === 'team' || id === 'alerts',
      state: skipped.has(id) ? 'skipped' : steps.indexOf(id) < cursor ? 'complete' : steps.indexOf(id) === cursor ? 'current' : 'upcoming',
    })),
    draft: {
      companyName: client?.companyName ?? '',
      logoUrl: client?.logoUrl ?? '',
      name: row.name,
      jobTitle: row.jobTitle,
      coverage: client?.coverage ?? '',
      regions: client?.targetTerritories ?? [],
      councils: client?.councilTargets ?? [],
      projectTypes: client?.projectTypes ?? [],
      valueRanges: client?.valueRanges ?? [],
      ribaStages: client?.ribaStages ?? [],
      alertsEnabled: row.alertsEnabled,
      frequency: row.alertFrequency === 'off' ? 'weekly' : row.alertFrequency,
    },
    checklistDismissed: row.checklistDismissed,
    checklist: [
      { id: 'workspace', label: 'Create your workspace', done: Boolean(row.organisationId), skipped: skipped.has('workspace') },
      { id: 'profile', label: 'Add your name and job role', done: Boolean(row.name && row.jobTitle), skipped: false },
      { id: 'icp', label: 'Choose the projects you want', done: Boolean(client?.coverage), skipped: skipped.has('icp') },
      { id: 'team', label: 'Invite a teammate', done: seats.length > 1, skipped: skipped.has('team') },
      { id: 'alerts', label: 'Choose email alerts', done: current === 'done', skipped: skipped.has('alerts') },
    ],
  }
}

function requireCurrent(row: typeof users.$inferSelect, step: Exclude<OnboardingStep, 'done'>) {
  if (row.onboardingStep === 'done') throw new HttpError(409, 'Onboarding is already complete')
  if (row.onboardingStep !== step) throw new HttpError(409, 'Continue from the current step')
}

async function advance(row: typeof users.$inferSelect, permissions: Permission[], extra?: Partial<typeof users.$inferInsert>) {
  const steps = sequence({ ...row, ...extra }, permissions)
  const index = steps.indexOf(row.onboardingStep as Exclude<OnboardingStep, 'done'>)
  const next = steps[index + 1] ?? 'done'
  await db
    .update(users)
    .set({
      ...extra,
      onboardingStep: next,
      updatedAt: new Date(),
    })
    .where(eq(users.id, row.id))
}

export async function onboardingRoutes(app: FastifyInstance) {
  app.get('/api/v1/onboarding', async (request) => {
    const user = requireUser(request)
    const row = await loadRow(user.id)
    return present(row, user.permissions)
  })

  app.get('/api/v1/onboarding/clients', async (request) => {
    const user = requireUser(request)
    if (user.platformRole !== 'super_admin') throw new HttpError(403, 'Forbidden')
    await db.insert(auditLog).values({
      actorUserId: user.id,
      action: 'staff.onboarding.review',
      method: request.method,
      path: '/api/v1/onboarding/clients',
    })
    const rows = await db
      .select({
        id: organisations.id,
        name: organisations.companyName,
        coverage: organisations.coverage,
        planName: organisations.planName,
        step: users.onboardingStep,
        role: users.orgRole,
      })
      .from(organisations)
      .leftJoin(users, eq(users.organisationId, organisations.id))
      .orderBy(asc(organisations.companyName))
    const byWorkspace = new Map<string, { id: string; name: string; coverage: string; planName: string; step: string; finished: boolean; owner: boolean }>()
    for (const row of rows) {
      const candidate = {
        id: row.id,
        name: row.name,
        coverage: row.coverage,
        planName: row.planName,
        step: row.step ?? 'workspace',
        finished: row.step === 'done',
        owner: row.role === 'owner',
      }
      const current = byWorkspace.get(row.id)
      if (!current || (candidate.owner && !current.owner) || (candidate.owner && current.owner && current.finished && !candidate.finished)) {
        byWorkspace.set(row.id, candidate)
      }
    }
    return { data: [...byWorkspace.values()].map(({ owner: _owner, ...client }) => client) }
  })

  app.put('/api/v1/onboarding', async (request, reply) => {
    const user = requireUser(request)
    const body = parseBody(saveBody, request.body, reply)
    if (!body) return
    const row = await loadRow(user.id)
    await applyStep(user, row, body)
    const fresh = await loadRow(user.id)
    return present(fresh, user.permissions)
  })
}

async function applyStep(user: AuthUser, row: typeof users.$inferSelect, body: SaveBody) {
  if (body.action === 'dismiss-checklist') {
    if (row.onboardingStep !== 'done') throw new HttpError(409, 'Finish setup before dismissing the checklist')
    await db.update(users).set({ checklistDismissed: true, updatedAt: new Date() }).where(eq(users.id, row.id))
    return
  }
  if (body.action === 'back') {
    if (row.onboardingStep === 'done') throw new HttpError(409, 'Onboarding is already complete')
    const steps = sequence(row, user.permissions)
    const index = steps.indexOf(row.onboardingStep as Exclude<OnboardingStep, 'done'>)
    const previous = steps[index - 1]
    if (!previous) throw new HttpError(409, 'This is the first step')
    await db.update(users).set({ onboardingStep: previous, updatedAt: new Date() }).where(eq(users.id, row.id))
    return
  }
  if (body.action === 'skip') {
    const current = row.onboardingStep
    if (current !== 'icp' && current !== 'team' && current !== 'alerts') throw new HttpError(400, 'This step is required')
    const skipped = [...new Set([...(row.onboardingSkipped ?? []), current])]
    await advance(row, user.permissions, {
      onboardingSkipped: skipped,
      ...(current === 'alerts' ? { alertsEnabled: true, alertFrequency: 'weekly' } : {}),
    })
    return
  }
  if (body.action === 'save-workspace') {
    if ((row.onboardingSkipped ?? []).includes('workspace')) throw new HttpError(403, 'Invited members join the workspace that sent the invite')
    requireCurrent(row, 'workspace')
    const logoUrl = cleanLogo(body.logoUrl)
    if (row.organisationId) {
      await db.update(organisations).set({ companyName: body.companyName, logoUrl }).where(eq(organisations.id, row.organisationId))
      await advance(row, user.permissions)
      return
    }
    const [organisation] = await db
      .insert(organisations)
      .values({ companyName: body.companyName, slug: slugify(body.companyName), logoUrl })
      .returning()
    if (!organisation) throw new HttpError(500, 'Could not create the workspace')
    await db
      .update(users)
      .set({ organisationId: organisation.id, orgRole: 'owner', name: row.name || body.companyName, updatedAt: new Date() })
      .where(eq(users.id, row.id))
    await db.insert(teamMembers).values({
      organisationId: organisation.id,
      userId: row.id,
      name: row.name || body.companyName,
      email: row.email,
      role: 'owner',
      status: 'Active',
    })
    const created = await loadRow(row.id)
    await advance(created, user.permissions)
    return
  }
  if (body.action === 'save-profile') {
    requireCurrent(row, 'profile')
    await db.update(teamMembers).set({ name: body.name }).where(eq(teamMembers.userId, row.id))
    await advance(row, user.permissions, { name: body.name, jobTitle: body.jobTitle })
    return
  }
  if (body.action === 'save-icp') {
    requireCurrent(row, 'icp')
    if (!row.organisationId || !user.permissions.includes('settings.write')) throw new HttpError(403, 'Forbidden')
    const regions = body.coverage === 'nationwide' ? UK_AREAS.map((area) => area.region) : body.regions
    const message = validateIcp({ ...body, regions })
    if (message) throw new HttpError(400, message)
    const councils = body.councils.filter((council) => councilsFor(regions).includes(council))
    const plan = coverageChoice(body.coverage)
    await db
      .update(organisations)
      .set({
        coverage: body.coverage,
        targetTerritories: regions,
        councilTargets: councils,
        projectTypes: body.projectTypes,
        valueRanges: body.valueRanges,
        ribaStages: body.ribaStages,
        tier: plan?.tier ?? 'REGIONAL',
        planName: plan?.planName ?? 'Regional Leads Feed',
        monthlyPrice: plan?.monthlyPrice ?? '£99',
      })
      .where(eq(organisations.id, row.organisationId))
    await advance(row, user.permissions)
    return
  }
  if (body.action === 'save-team') {
    requireCurrent(row, 'team')
    if (!row.organisationId || !user.permissions.includes('team.manage')) throw new HttpError(403, 'Forbidden')
    if (!body.invites.length) throw new HttpError(400, 'Add a teammate or skip this step')
    const [client] = await db.select({ companyName: organisations.companyName }).from(organisations).where(eq(organisations.id, row.organisationId)).limit(1)
    const company = client?.companyName || user.companyName || 'your workspace'
    for (const invite of body.invites) {
      const email = invite.email.toLowerCase()
      if (email === row.email) throw new HttpError(400, 'You are already in this workspace')
      const [already] = await db
        .select({ id: teamMembers.id })
        .from(teamMembers)
        .where(and(eq(teamMembers.organisationId, row.organisationId), eq(teamMembers.email, email)))
        .limit(1)
      if (already) throw new HttpError(409, 'That email is already on the team')
      const token = randomBytes(24).toString('hex')
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      const name = email
        .split('@')[0]
        ?.split(/[._-]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
      await db.insert(teamMembers).values({
        organisationId: row.organisationId,
        name: name || 'Invited member',
        email,
        role: invite.role,
        status: 'Pending',
      })
      await db.insert(invitations).values({
        organisationId: row.organisationId,
        email,
        role: invite.role,
        token,
        expiresAt,
        invitedBy: row.id,
      })
      const inviteUrl = `${appOrigin()}/accept-invite?token=${token}`
      await mailer.send({
        kind: 'invite',
        to: email,
        subject: `Join ${company} on PlanningPal`,
        text: `${row.name || 'A teammate'} invited you to ${company} as ${roleLabel(invite.role)}.\nOpen this link to create your account:\n${inviteUrl}`,
      })
    }
    await advance(row, user.permissions)
    return
  }
  requireCurrent(row, 'alerts')
  await advance(row, user.permissions, {
    alertsEnabled: body.enabled,
    alertFrequency: body.enabled ? body.frequency : 'off',
  })
}
