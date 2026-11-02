import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../app.ts'
import { db } from '../db/client.ts'
import { runMigrations } from '../db/migrate.ts'
import { organisations, planningApplications, workspaceLeads } from '../db/schema.ts'
import { useLeadScanner } from '../leads/fetch.ts'
import { createActor } from './actors.ts'

let app: FastifyInstance
let owner = ''
let other = ''
let viewer = ''
let workspace = ''

const today = new Date().toISOString().slice(0, 10)

async function application(authority: string, ref: string, published: string) {
  const [row] = await db.insert(planningApplications).values({
    applicationRef: ref,
    compositeHash: randomUUID(),
    heading: ref,
    localAuthority: authority,
    region: authority === 'Camden' ? 'London' : 'Other',
    publicationDate: published,
    sourceRecord: { Heading: ref, 'Local Authority': authority, 'Application Reference': ref, Region: authority === 'Camden' ? 'London' : 'Other' },
    sourceIndex: Math.floor(Math.random() * 100000),
  }).returning()
  return row!
}

beforeAll(async () => {
  await runMigrations()
  app = buildApp()
  await app.ready()
  const [org] = await db.insert(organisations).values({
    companyName: 'Fetch Windows',
    coverage: 'regional',
    targetTerritories: ['London'],
    councilTargets: ['Camden'],
  }).returning()
  workspace = org!.id
  const [elsewhere] = await db.insert(organisations).values({
    companyName: 'Other Fetch',
    coverage: 'regional',
    targetTerritories: ['Wales'],
    councilTargets: ['Cardiff'],
  }).returning()
  owner = (await createActor({ email: 'fetch-owner@example.com', name: 'Owner', organisationId: workspace, orgRole: 'owner' })).cookie
  viewer = (await createActor({ email: 'fetch-viewer@example.com', name: 'Viewer', organisationId: workspace, orgRole: 'viewer' })).cookie
  other = (await createActor({ email: 'fetch-other@example.com', name: 'Other', organisationId: elsewhere!.id, orgRole: 'owner' })).cookie
  await application('Camden', `RECENT-${randomUUID()}`, today)
  await application('Camden', `OLD-${randomUUID()}`, '2020-01-01')
  await application('Westminster', `OTHER-${randomUUID()}`, today)
})

afterAll(async () => {
  useLeadScanner(null)
  await app.close()
})

describe('workspace lead fetch', () => {
  it('links only recent applications in the workspace ICP and hides them from another tenant', async () => {
    const denied = await app.inject({ method: 'POST', url: '/api/v1/lead-fetches', headers: { cookie: viewer }, payload: { days: 3 } })
    expect(denied.statusCode).toBe(403)
    const started = await app.inject({ method: 'POST', url: '/api/v1/lead-fetches', headers: { cookie: owner }, payload: { days: 3 } })
    expect(started.statusCode).toBe(201)
    const job = started.json().job
    expect(job.status).toBe('running')
    expect(job.total).toBe(1)
    const again = await app.inject({ method: 'POST', url: '/api/v1/lead-fetches', headers: { cookie: owner }, payload: { days: 7 } })
    expect(again.json().job.id).toBe(job.id)
    const stepped = await app.inject({ method: 'POST', url: `/api/v1/lead-fetches/${job.id}/advance`, headers: { cookie: owner } })
    expect(stepped.json().job.status).toBe('succeeded')
    expect(stepped.json().job.found).toBe(1)
    expect(stepped.json().job.scanned).toBe(1)
    const leads = await app.inject({ method: 'GET', url: '/api/v1/workspace-leads', headers: { cookie: owner } })
    const titles = leads.json().data.map((item: { title: string }) => item.title)
    expect(titles.some((title: string) => title.startsWith('RECENT-'))).toBe(true)
    expect(titles.some((title: string) => title.startsWith('OLD-') || title.startsWith('OTHER-'))).toBe(false)
    const swapped = await app.inject({ method: 'POST', url: `/api/v1/lead-fetches/${job.id}/advance`, headers: { cookie: other } })
    expect(swapped.statusCode).toBe(404)
    const foreign = await app.inject({ method: 'GET', url: '/api/v1/workspace-leads', headers: { cookie: other } })
    expect(foreign.json().data).toEqual([])
    const quiet = await app.inject({ method: 'GET', url: '/api/v1/lead-fetches/current', headers: { cookie: other } })
    expect(quiet.json().job).toBeNull()
  })

  it('reports an empty window and a partial scan that can be retried', async () => {
    const [org] = await db.insert(organisations).values({
      companyName: 'Partial Fetch',
      coverage: 'multi_county',
      targetTerritories: ['London', 'South East'],
      councilTargets: ['Camden', 'Broken'],
    }).returning()
    const actor = await createActor({ email: 'fetch-partial@example.com', name: 'Partial', organisationId: org!.id, orgRole: 'owner' })
    await application('Broken', `BROKEN-${randomUUID()}`, today)
    useLeadScanner(async (council, since) => {
      if (council === 'Broken') throw new Error('council timeout')
      const rows = await db.select({ id: planningApplications.id }).from(planningApplications)
      return rows.filter(() => council === 'Camden').map((row) => row.id).filter(() => since.getTime() > 0)
    })
    const started = await app.inject({ method: 'POST', url: '/api/v1/lead-fetches', headers: { cookie: actor.cookie }, payload: { days: 3 } })
    let job = started.json().job
    job = (await app.inject({ method: 'POST', url: `/api/v1/lead-fetches/${job.id}/advance`, headers: { cookie: actor.cookie } })).json().job
    expect(job.status).toBe('partial')
    expect(job.found).toBeGreaterThan(0)
    const retry = await app.inject({ method: 'POST', url: `/api/v1/lead-fetches/${job.id}/retry`, headers: { cookie: actor.cookie } })
    expect(retry.json().job.status).toBe('running')
    expect(retry.json().job.total).toBe(1)
    useLeadScanner(async () => [])
    const done = await app.inject({ method: 'POST', url: `/api/v1/lead-fetches/${job.id}/advance`, headers: { cookie: actor.cookie } })
    expect(done.json().job.status).toBe('succeeded')
    const linked = await db.select().from(workspaceLeads).where(eq(workspaceLeads.workspaceId, org!.id))
    expect(linked.length).toBeGreaterThan(0)
    void workspace
  })

  it('suggests a wider window when nothing recent matches', async () => {
    const [org] = await db.insert(organisations).values({
      companyName: 'Empty Fetch',
      coverage: 'regional',
      targetTerritories: ['Wales'],
      councilTargets: ['Cardiff'],
    }).returning()
    const actor = await createActor({ email: 'fetch-empty@example.com', name: 'Empty', organisationId: org!.id, orgRole: 'owner' })
    await application('Cardiff', `STALE-${randomUUID()}`, '2019-05-01')
    useLeadScanner(null)
    const started = await app.inject({ method: 'POST', url: '/api/v1/lead-fetches', headers: { cookie: actor.cookie }, payload: { days: 3 } })
    const job = started.json().job
    const done = await app.inject({ method: 'POST', url: `/api/v1/lead-fetches/${job.id}/advance`, headers: { cookie: actor.cookie } })
    expect(done.json().job.status).toBe('empty')
    expect(done.json().job.suggest).toBe('widen')
    expect(done.json().job.found).toBe(0)
  })
})
