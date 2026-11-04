import { coverageChoice, councilsFor, UK_AREAS, validateIcp, type OnboardingStep } from '@planningpal/shared'
import { and, asc, eq, isNull } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { appOrigin, mailer } from '../auth/mailer.ts'
import { roleLabel, type Permission } from '../auth/permissions.ts'
import { db } from '../db/client.ts'
import { auditLog, invitations, organisations, planningApplications, teamMembers, users, workspaceLeads } from '../db/schema.ts'
import { HttpError, parseBody, requireUser } from '../lib/http.ts'
import type { AuthUser } from '../types.ts'

const logoPattern = /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=\s]+$/i

const createCustomerBody = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().max(60).optional().default(''),
  email: z.string().trim().email(),
  companyName: z.string().trim().max(120).optional().default(''),
  coverage: z.enum(['regional', 'multi_county', 'nationwide', 'CATEGORY_3', 'ALL_UK']).optional(),
  sendEmail: z.boolean().optional().default(true),
})

const saveBody = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('save-workspace'),
    companyName: z.string().trim().min(2).max(120),
    logoUrl: z.string().max(180_000).optional(),
  }),
  z.object({
    action: z.literal('save-profile'),
    name: z.string().trim().max(80).optional(),
    firstName: z.string().trim().max(60).optional(),
    lastName: z.string().trim().max(60).optional(),
    jobTitle: z.string().trim().min(1).max(80),
    phone: z.string().trim().max(40).optional(),
    secondaryEmail: z.string().trim().max(120).optional(),
    companyName: z.string().trim().max(120).optional(),
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
    invites: z
      .array(
        z.object({
          name: z.string().trim().max(80).optional(),
          email: z.string().email(),
          role: z.enum(['admin', 'member', 'viewer']).optional().default('member'),
        }),
      )
      .max(10),
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
  const prefs = (row.emailPreferences ?? {}) as Record<string, unknown>
  const nameParts = (row.name && !row.name.includes('@') ? row.name : '').trim().split(/\s+/).filter(Boolean)
  const firstName = typeof prefs.firstName === 'string' && prefs.firstName ? prefs.firstName : (nameParts[0] ?? '')
  const lastName = typeof prefs.lastName === 'string' && prefs.lastName ? prefs.lastName : nameParts.slice(1).join(' ')
  const phone = typeof prefs.phone === 'string' ? prefs.phone : ''
  const secondaryEmail = typeof prefs.secondaryEmail === 'string' ? prefs.secondaryEmail : ''
  const availableSlots = Math.max(1, 3 - Math.max(0, seats.length - 1))
  const current = row.onboardingStep as OnboardingStep
  const cursor = current === 'done' ? steps.length : Math.max(0, steps.indexOf(current))
  return {
    step: current,
    invited: skipped.has('workspace'),
    orgRole: row.orgRole,
    availableSlots,
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
      firstName,
      lastName,
      email: row.email,
      phone,
      secondaryEmail,
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
        userName: users.name,
      })
      .from(organisations)
      .leftJoin(users, eq(users.organisationId, organisations.id))
      .orderBy(asc(organisations.companyName))
    const pendingInvites = await db
      .select({
        organisationId: invitations.organisationId,
        token: invitations.token,
        role: invitations.role,
      })
      .from(invitations)
      .where(isNull(invitations.acceptedAt))
    const inviteByOrg = new Map<string, string>()
    for (const inv of pendingInvites) {
      if (inv.role === 'owner' || !inviteByOrg.has(inv.organisationId)) {
        inviteByOrg.set(inv.organisationId, `${appOrigin()}/accept-invite?token=${inv.token}`)
      }
    }
    const byWorkspace = new Map<
      string,
      { id: string; name: string; coverage: string; planName: string; step: string; finished: boolean; owner: boolean; ownerName?: string; inviteUrl?: string }
    >()
    for (const row of rows) {
      const cleanUserName = row.userName && !row.userName.includes('@') ? row.userName : undefined
      const candidate = {
        id: row.id,
        name: row.name,
        coverage: row.coverage,
        planName: row.planName,
        step: row.step ?? 'workspace',
        finished: row.step === 'done',
        owner: row.role === 'owner',
        ownerName: cleanUserName,
        inviteUrl: inviteByOrg.get(row.id),
      }
      const current = byWorkspace.get(row.id)
      if (!current || (candidate.owner && !current.owner) || (candidate.owner && current.owner && current.finished && !candidate.finished)) {
        byWorkspace.set(row.id, candidate)
      }
    }
    return { data: [...byWorkspace.values()].map(({ owner: _owner, ...client }) => client) }
  })

  app.post('/api/v1/onboarding/clients', async (request, reply) => {
    const user = requireUser(request)
    if (user.platformRole !== 'super_admin') throw new HttpError(403, 'Forbidden')
    const body = parseBody(createCustomerBody, request.body, reply)
    if (!body) return
    const fullName = [body.firstName, body.lastName].filter(Boolean).join(' ').trim() || body.firstName
    const companyName = body.companyName?.trim() || `${fullName} Workspace`
    const email = body.email.toLowerCase()

    let coverageKey: 'regional' | 'multi_county' | 'nationwide' | undefined
    if (body.coverage === 'CATEGORY_3' || body.coverage === 'regional') coverageKey = 'regional'
    else if (body.coverage === 'ALL_UK' || body.coverage === 'nationwide') coverageKey = 'nationwide'
    else if (body.coverage === 'multi_county') coverageKey = 'multi_county'

    const plan = coverageKey ? coverageChoice(coverageKey) : undefined
    const [organisation] = await db
      .insert(organisations)
      .values({
        companyName,
        slug: slugify(companyName),
        coverage: coverageKey ?? '',
        tier: plan?.tier ?? (coverageKey === 'nationwide' ? 'ALL_UK' : 'CATEGORY_3'),
        planName: plan?.planName ?? 'Team Plan',
        monthlyPrice: plan?.monthlyPrice ?? '£2,950',
      })
      .returning()
    if (!organisation) throw new HttpError(500, 'Could not create customer workspace')
    const token = randomBytes(24).toString('hex')
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    await db.insert(teamMembers).values({
      organisationId: organisation.id,
      name: fullName,
      email,
      role: 'owner',
      status: 'Pending',
    })
    await db.insert(invitations).values({
      organisationId: organisation.id,
      email,
      role: 'owner',
      token,
      expiresAt,
      invitedBy: user.id,
    })
    const origin = (request.headers.origin as string | undefined) || appOrigin()
    const inviteUrl = `${origin.replace(/\/$/, '')}/accept-invite?token=${token}`
    let emailSent = false
    if (body.sendEmail !== false) {
      await mailer.send({
        kind: 'invite',
        to: email,
        subject: `Your ${companyName} workspace on PlanningPal is ready`,
        text: `Hello ${fullName},\n\nYour PlanningPal workspace (${companyName}) has been created.\nOpen your personal onboarding link to set up your account and team:\n${inviteUrl}`,
      })
      emailSent = true
    }
    await db.insert(auditLog).values({
      actorUserId: user.id,
      workspaceId: organisation.id,
      action: 'staff.customer.create',
      method: request.method,
      path: '/api/v1/onboarding/clients',
    })
    return reply.code(201).send({
      id: organisation.id,
      name: organisation.companyName,
      customerName: fullName,
      email,
      coverage: organisation.coverage,
      planName: organisation.planName,
      step: 'profile',
      finished: false,
      inviteUrl,
      token,
      inviteToken: token,
      emailSent,
    })
  })

  app.post('/api/v1/onboarding/clients/:id/resend-invite', async (request, reply) => {
    const user = requireUser(request)
    if (user.platformRole !== 'super_admin') throw new HttpError(403, 'Forbidden')
    const { id } = request.params as { id: string }
    const [organisation] = await db
      .select()
      .from(organisations)
      .where(eq(organisations.id, id))
      .limit(1)
    if (!organisation) throw new HttpError(404, 'Organisation not found')

    const pendingInvites = await db
      .select()
      .from(invitations)
      .where(and(eq(invitations.organisationId, id), isNull(invitations.acceptedAt)))
      .orderBy(asc(invitations.createdAt))
    const existingInvite = pendingInvites.find((i) => i.role === 'owner') || pendingInvites[0]

    let token: string
    let email: string
    if (existingInvite && existingInvite.expiresAt.getTime() > Date.now()) {
      token = existingInvite.token
      email = existingInvite.email
    } else {
      const [member] = await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.organisationId, id))
        .limit(1)
      email = existingInvite?.email || member?.email || ''
      if (!email) throw new HttpError(400, 'No client email found to send invite to')
      token = randomBytes(24).toString('hex')
      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      await db.insert(invitations).values({
        organisationId: id,
        email,
        role: existingInvite?.role || 'owner',
        token,
        expiresAt,
        invitedBy: user.id,
      })
    }

    const [member] = await db
      .select({ name: teamMembers.name })
      .from(teamMembers)
      .where(and(eq(teamMembers.organisationId, id), eq(teamMembers.email, email)))
      .limit(1)
    const fullName = member?.name?.trim() || organisation.companyName

    const origin = (request.headers.origin as string | undefined) || appOrigin()
    const inviteUrl = `${origin.replace(/\/$/, '')}/accept-invite?token=${token}`

    await mailer.send({
      kind: 'invite',
      to: email,
      subject: `Your ${organisation.companyName} workspace on PlanningPal is ready`,
      text: `Hello ${fullName},\n\nYour PlanningPal workspace (${organisation.companyName}) is ready.\nOpen your personal onboarding link to set up your account and team:\n${inviteUrl}`,
    })

    await db.insert(auditLog).values({
      actorUserId: user.id,
      workspaceId: id,
      action: 'staff.customer.resend_invite',
      method: request.method,
      path: `/api/v1/onboarding/clients/${id}/resend-invite`,
    })

    return reply.send({
      sent: true,
      email,
      inviteUrl,
      token,
      inviteToken: token,
    })
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
    const fullName =
      body.name?.trim() ||
      [body.firstName?.trim(), body.lastName?.trim()].filter(Boolean).join(' ').trim()
    if (!fullName) throw new HttpError(400, 'Enter your name')
    const parts = fullName.split(/\s+/)
    const firstName = body.firstName?.trim() || parts[0] || ''
    const lastName = body.lastName?.trim() || parts.slice(1).join(' ')
    const existingPrefs = (row.emailPreferences ?? {}) as Record<string, unknown>
    const updatedPrefs = {
      ...existingPrefs,
      firstName,
      lastName,
      ...(body.phone !== undefined ? { phone: body.phone.trim() } : {}),
      ...(body.secondaryEmail !== undefined ? { secondaryEmail: body.secondaryEmail.trim() } : {}),
    }
    if (body.companyName?.trim() && row.organisationId && row.orgRole === 'owner') {
      await db.update(organisations).set({ companyName: body.companyName.trim() }).where(eq(organisations.id, row.organisationId))
    }
    await db.update(teamMembers).set({ name: fullName }).where(eq(teamMembers.userId, row.id))
    await advance(row, user.permissions, {
      name: fullName,
      jobTitle: body.jobTitle,
      emailPreferences: updatedPrefs,
    })
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
    // Seed initial workspaceLeads matching the organisation's regions so the dashboard has immediate schemes
    const apps = await db.select({ id: planningApplications.id, region: planningApplications.region }).from(planningApplications).limit(80)
    const matching = apps.filter((a) => body.coverage === 'nationwide' || !a.region || regions.includes(a.region)).slice(0, 30)
    const toLink = matching.length ? matching : apps.slice(0, 20)
    if (toLink.length > 0) {
      const existingLinks = await db
        .select({ applicationId: workspaceLeads.applicationId })
        .from(workspaceLeads)
        .where(eq(workspaceLeads.workspaceId, row.organisationId))
      const linkedSet = new Set(existingLinks.map((l) => l.applicationId))
      const freshLinks = toLink
        .filter((a) => !linkedSet.has(a.id))
        .map((a) => ({ workspaceId: row.organisationId!, applicationId: a.id }))
      if (freshLinks.length > 0) {
        await db.insert(workspaceLeads).values(freshLinks).catch(() => undefined)
      }
    }
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
      const role = invite.role || 'member'
      if (email === row.email) throw new HttpError(400, 'You are already in this workspace')
      const [already] = await db
        .select({ id: teamMembers.id })
        .from(teamMembers)
        .where(and(eq(teamMembers.organisationId, row.organisationId), eq(teamMembers.email, email)))
        .limit(1)
      if (already) throw new HttpError(409, 'That email is already on the team')
      const token = randomBytes(24).toString('hex')
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      const fallbackName = email
        .split('@')[0]
        ?.split(/[._-]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
      const memberName = invite.name?.trim() || fallbackName || 'Invited member'
      await db.insert(teamMembers).values({
        organisationId: row.organisationId,
        name: memberName,
        email,
        role,
        status: 'Pending',
      })
      await db.insert(invitations).values({
        organisationId: row.organisationId,
        email,
        role,
        token,
        expiresAt,
        invitedBy: row.id,
      })
      const inviteUrl = `${appOrigin()}/accept-invite?token=${token}`
      await mailer.send({
        kind: 'invite',
        to: email,
        subject: `Join ${company} on PlanningPal`,
        text: `${row.name || 'A teammate'} invited you to ${company} as ${roleLabel(role)}.\nOpen this link to create your account:\n${inviteUrl}`,
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
