import type { FastifyInstance } from 'fastify'
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { alertDue, validateIcp } from '@planningpal/shared'
import { buildApp } from '../app.ts'
import { db } from '../db/client.ts'
import { runMigrations } from '../db/migrate.ts'
import { auditLog, organisations, users } from '../db/schema.ts'
import { createActor } from './actors.ts'

let app: FastifyInstance
let founder = ''
let other = ''
let invitee = ''
let member = ''
let staff = ''

const icp = {
  action: 'save-icp',
  coverage: 'regional',
  regions: ['London'],
  councils: ['Camden'],
  projectTypes: ['Residential'],
  valueRanges: ['£1m–£5m'],
  ribaStages: ['0', '2'],
}

beforeAll(async () => {
  await runMigrations()
  app = buildApp()
  await app.ready()
  const owner = await createActor({
    email: 'founder@onboarding.example',
    name: 'Founder',
    organisationId: null,
    orgRole: 'owner',
    onboardingStep: 'workspace',
    checklistDismissed: false,
  })
  const rival = await createActor({
    email: 'rival@onboarding.example',
    name: 'Rival',
    organisationId: null,
    orgRole: 'owner',
    onboardingStep: 'workspace',
    checklistDismissed: false,
  })
  founder = owner.cookie
  other = rival.cookie
  staff = (await createActor({
    email: 'staff@onboarding.example',
    name: 'Staff',
    organisationId: null,
    orgRole: 'member',
    platformRole: 'super_admin',
  })).cookie
})

afterAll(async () => {
  await app.close()
})

describe('onboarding flow', () => {
  it('saves each step, resumes, and keeps another account out', async () => {
    const start = await app.inject({ method: 'GET', url: '/api/v1/onboarding', headers: { cookie: founder } })
    expect(start.statusCode).toBe(200)
    expect(start.json().step).toBe('workspace')

    const named = await app.inject({
      method: 'PUT',
      url: '/api/v1/onboarding',
      headers: { cookie: founder },
      payload: { action: 'save-workspace', companyName: 'Alpha Windows', logoUrl: 'data:image/svg+xml;base64,abc' },
    })
    expect(named.statusCode).toBe(400)

    const workspace = await app.inject({
      method: 'PUT',
      url: '/api/v1/onboarding',
      headers: { cookie: founder },
      payload: { action: 'save-workspace', companyName: 'Alpha Windows' },
    })
    expect(workspace.statusCode).toBe(200)
    expect(workspace.json().step).toBe('profile')
    expect(workspace.json().draft.companyName).toBe('Alpha Windows')

    const resumed = await app.inject({ method: 'GET', url: '/api/v1/onboarding', headers: { cookie: founder } })
    expect(resumed.json().step).toBe('profile')

    const rivalView = await app.inject({ method: 'GET', url: '/api/v1/onboarding', headers: { cookie: other } })
    expect(rivalView.json().draft.companyName).toBe('')
    const [alpha] = await db.select().from(organisations).where(eq(organisations.companyName, 'Alpha Windows')).limit(1)
    const swapped = await app.inject({ method: 'GET', url: `/api/v1/workspaces/${alpha!.id}`, headers: { cookie: other } })
    expect(swapped.statusCode).toBe(404)

    const profile = await app.inject({
      method: 'PUT',
      url: '/api/v1/onboarding',
      headers: { cookie: founder },
      payload: { action: 'save-profile', name: 'Alex Founder', jobTitle: 'Bid manager' },
    })
    expect(profile.json().step).toBe('icp')

    const tooWide = await app.inject({
      method: 'PUT',
      url: '/api/v1/onboarding',
      headers: { cookie: founder },
      payload: { ...icp, regions: ['London', 'Scotland'] },
    })
    expect(tooWide.statusCode).toBe(400)

    const outside = await app.inject({
      method: 'PUT',
      url: '/api/v1/onboarding',
      headers: { cookie: founder },
      payload: { ...icp, councils: ['Glasgow City'] },
    })
    expect(outside.statusCode).toBe(400)

    const fit = await app.inject({
      method: 'PUT',
      url: '/api/v1/onboarding',
      headers: { cookie: founder },
      payload: icp,
    })
    expect(fit.statusCode).toBe(200)
    expect(fit.json().step).toBe('team')

    const skipped = await app.inject({
      method: 'PUT',
      url: '/api/v1/onboarding',
      headers: { cookie: founder },
      payload: { action: 'skip' },
    })
    expect(skipped.json().step).toBe('alerts')

    const finished = await app.inject({
      method: 'PUT',
      url: '/api/v1/onboarding',
      headers: { cookie: founder },
      payload: { action: 'save-alerts', enabled: true, frequency: 'weekly' },
    })
    expect(finished.json().step).toBe('done')
    expect(finished.json().checklistDismissed).toBe(false)
    expect(finished.json().checklist.some((item: { id: string; done: boolean }) => item.id === 'icp' && item.done)).toBe(true)

    const hidden = await app.inject({
      method: 'PUT',
      url: '/api/v1/onboarding',
      headers: { cookie: founder },
      payload: { action: 'dismiss-checklist' },
    })
    expect(hidden.json().checklistDismissed).toBe(true)

    const [stored] = await db.select().from(organisations).where(eq(organisations.id, alpha!.id))
    expect(stored?.coverage).toBe('regional')
    expect(stored?.planName).toBe('Regional Leads Feed')
    expect(stored?.councilTargets).toEqual(['Camden'])
  })

  it('skips workspace creation for an invited member and blocks admin actions', async () => {
    const [alpha] = await db.select().from(organisations).where(eq(organisations.companyName, 'Alpha Windows')).limit(1)
    const invited = await createActor({
      email: 'invited@onboarding.example',
      name: 'Invited',
      organisationId: alpha!.id,
      orgRole: 'member',
      onboardingStep: 'profile',
      onboardingSkipped: ['workspace'],
      checklistDismissed: false,
    })
    invitee = invited.cookie
    const blocked = await app.inject({
      method: 'PUT',
      url: '/api/v1/onboarding',
      headers: { cookie: invitee },
      payload: { action: 'save-workspace', companyName: 'Stolen Co' },
    })
    expect(blocked.statusCode).toBe(403)
    const profile = await app.inject({
      method: 'PUT',
      url: '/api/v1/onboarding',
      headers: { cookie: invitee },
      payload: { action: 'save-profile', name: 'Indy Member', jobTitle: 'Estimator' },
    })
    expect(profile.statusCode).toBe(200)
    expect(profile.json().step).toBe('alerts')
    const [still] = await db.select().from(organisations).where(eq(organisations.companyName, 'Stolen Co'))
    expect(still).toBeUndefined()

    const teammate = await createActor({
      email: 'member-step@onboarding.example',
      name: 'Member',
      organisationId: alpha!.id,
      orgRole: 'member',
      onboardingStep: 'team',
      checklistDismissed: false,
    })
    member = teammate.cookie
    const adminAttempt = await app.inject({
      method: 'PUT',
      url: '/api/v1/onboarding',
      headers: { cookie: member },
      payload: { action: 'save-team', invites: [{ email: 'new@onboarding.example', role: 'admin' }] },
    })
    expect(adminAttempt.statusCode).toBe(403)
  })

  it('lets a super admin read onboarding status per client and writes an audit row', async () => {
    const denied = await app.inject({ method: 'GET', url: '/api/v1/onboarding/clients', headers: { cookie: founder } })
    expect(denied.statusCode).toBe(403)
    const [alpha] = await db.select().from(organisations).where(eq(organisations.companyName, 'Alpha Windows')).limit(1)
    const quiet = await app.inject({
      method: 'GET',
      url: '/api/v1/onboarding',
      headers: { cookie: staff, 'x-workspace-id': alpha!.id },
    })
    expect(quiet.json().draft.companyName).not.toBe('Alpha Windows')
    const listed = await app.inject({ method: 'GET', url: '/api/v1/onboarding/clients', headers: { cookie: staff } })
    expect(listed.statusCode).toBe(200)
    const alphaRow = listed.json().data.find((client: { name: string }) => client.name === 'Alpha Windows')
    expect(alphaRow.finished).toBe(true)
    expect(JSON.stringify(listed.json())).not.toContain('@')
    const rows = await db.select().from(auditLog).where(eq(auditLog.action, 'staff.onboarding.review'))
    expect(rows.length).toBeGreaterThan(0)
    const [staffRow] = await db.select().from(users).where(eq(users.email, 'staff@onboarding.example'))
    expect(rows.some((row) => row.actorUserId === staffRow?.id)).toBe(true)
  })
})

describe('coverage and alert frequency', () => {
  it('rejects a regional selection that spans two regions', () => {
    expect(validateIcp({ ...icp, coverage: 'regional', regions: ['London', 'Wales'], action: undefined } as never)).toBeTypeOf('string')
    expect(validateIcp({
      coverage: 'multi_county',
      regions: ['London', 'South East'],
      councils: [],
      projectTypes: ['Commercial'],
      valueRanges: ['£250k–£1m'],
      ribaStages: ['1'],
    })).toBeNull()
  })

  it('sends immediate alerts every time and weekly alerts after six days', () => {
    const now = new Date('2026-06-15T09:00:00Z')
    expect(alertDue('immediate', new Date('2026-06-15T08:00:00Z'), now)).toBe(true)
    expect(alertDue('weekly', new Date('2026-06-14T09:00:00Z'), now)).toBe(false)
    expect(alertDue('weekly', new Date('2026-06-01T09:00:00Z'), now)).toBe(true)
    expect(alertDue('off', null, now)).toBe(false)
    expect(alertDue('daily', null, now)).toBe(true)
  })
})
