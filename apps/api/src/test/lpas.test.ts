import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { inArray } from 'drizzle-orm'
import { LPA_RECORDS, feedHealth, planItIngestAreas } from '@planningpal/shared'
import { buildApp } from '../app.ts'
import { db } from '../db/client.ts'
import { runMigrations } from '../db/migrate.ts'
import { localPlanningAuthorities, users } from '../db/schema.ts'
import { createActor } from './actors.ts'

let app: FastifyInstance
let owner = ''
let staff = ''

beforeAll(async () => {
  await runMigrations()
  app = buildApp()
  await app.ready()
  await db.delete(users).where(inArray(users.email, ['lpa-owner@example.com', 'lpa-staff@example.com']))
  owner = (await createActor({ email: 'lpa-owner@example.com', name: 'Owner', organisationId: null, orgRole: 'owner' })).cookie
  staff = (await createActor({ email: 'lpa-staff@example.com', name: 'Staff', organisationId: null, orgRole: 'member', platformRole: 'super_admin' })).cookie
})

afterAll(async () => {
  await app.close()
})

describe('UK local planning authorities', () => {
  it('seeds 380 active authorities and the PlanIt area map', async () => {
    const rows = await db.select().from(localPlanningAuthorities)
    expect(rows.filter((row) => row.status === 'active')).toHaveLength(380)
    expect(rows.filter((row) => row.status === 'abolished')).toHaveLength(43)
    const areas = planItIngestAreas()
    expect(areas).toContain('Adur and Worthing')
    expect(areas).toContain('Allerdale')
    expect(areas).toContain('Carlisle')
    expect(areas).toContain('Copeland')
    expect(areas.some((area) => /ebbsfleet/i.test(area))).toBe(false)
    const cumberland = rows.find((row) => row.name === 'Cumberland Council')
    expect(cumberland?.planitQueryAreas).toEqual(['Allerdale', 'Carlisle', 'Copeland'])
    const unavailable = rows.filter((row) => row.status === 'active' && row.coverage === 'unavailable').map((row) => row.name).sort()
    expect(unavailable).toEqual([
      'Ebbsfleet Development Corporation',
      'Hartlepool Development Corporation',
      'Middlesbrough Development Corporation',
    ])
  })

  it('flags the 29 stale feeds as of 1 Nov 2026 and hides health from a client', async () => {
    const health = feedHealth(LPA_RECORDS, { asOf: new Date('2026-11-01T00:00:00Z'), staleDays: 92 })
    expect(health.stale).toHaveLength(29)
    expect(health.unavailable).toHaveLength(3)
    expect(health.unavailable.every((row) => row.coverage === 'coverage unavailable')).toBe(true)
    const denied = await app.inject({ method: 'GET', url: '/api/v1/lpas/health', headers: { cookie: owner } })
    expect(denied.statusCode).toBe(403)
    const listed = await app.inject({ method: 'GET', url: '/api/v1/lpas/health', headers: { cookie: staff } })
    expect(listed.statusCode).toBe(200)
    expect(listed.json().unavailable.map((row: { name: string }) => row.name).sort()).toEqual([
      'Ebbsfleet Development Corporation',
      'Hartlepool Development Corporation',
      'Middlesbrough Development Corporation',
    ])
    expect(listed.json().stale.some((row: { name: string }) => row.name.startsWith('Blackburn'))).toBe(true)
  })
})
