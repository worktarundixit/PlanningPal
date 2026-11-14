import { icpCouncils, labelsForCouncil, LEAD_WINDOWS, normaliseAuthorityLabel } from '@planningpal/shared'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../db/client.ts'
import { leadFetches, organisations, planningApplications, workspaceLeads } from '../db/schema.ts'
import { ensureApplicationRowEnriched } from '../ingest/run.ts'
import { HttpError } from '../lib/http.ts'

const BATCH = 4

type Scanner = (council: string, since: Date) => Promise<string[]>

async function matchCouncil(council: string, since: Date) {
  const keys = [...new Set([...labelsForCouncil(council)].map(normaliseAuthorityLabel).filter(Boolean))]
  if (!keys.length) return []
  const sinceIso = since.toISOString().slice(0, 10)
  const normalisedAuthority = sql`trim(regexp_replace(regexp_replace(replace(lower(${planningApplications.localAuthority}), '&', ' and '), '[^a-z0-9]+', ' ', 'g'), '\\s+', ' ', 'g'))`
  const rows = await db
    .select({ id: planningApplications.id })
    .from(planningApplications)
    .where(and(
      sql`${normalisedAuthority} in (${sql.join(keys.map((key) => sql`${key}`), sql`, `)})`,
      sql`(
        ${planningApplications.publicationDate} >= ${sinceIso}
        OR ${planningApplications.validationDate} >= ${sinceIso}::date
        OR (${planningApplications.publicationDate} = '' AND ${planningApplications.createdAt} >= ${since.toISOString()}::timestamptz)
      )`,
    ))
  return rows.map((row) => row.id)
}

let scanner: Scanner = matchCouncil

/** Tests replace the council scanner. Pass null to restore the catalogue lookup. */
export function useLeadScanner(next: Scanner | null) {
  scanner = next ?? matchCouncil
}

function present(row: typeof leadFetches.$inferSelect) {
  const suggest = row.status === 'empty' ? (row.days < 7 ? 'widen' : 'icp') : row.status === 'partial' ? 'retry' : null
  return {
    id: row.id,
    days: row.days,
    status: row.status,
    scanned: Math.min(row.cursor, row.councils.length),
    total: row.councils.length,
    found: row.found,
    failed: row.failedCouncils.length,
    message: row.message,
    suggest,
  }
}

export type LeadFetchView = ReturnType<typeof present>

function allowedDays(days: number) {
  return LEAD_WINDOWS.some((window) => window.days === days)
}

export async function currentLeadFetch(workspaceId: string) {
  const [row] = await db
    .select()
    .from(leadFetches)
    .where(eq(leadFetches.workspaceId, workspaceId))
    .orderBy(desc(leadFetches.createdAt))
    .limit(1)
  return row ? present(row) : null
}

export async function startLeadFetch(workspaceId: string, days: number) {
  if (!allowedDays(days)) throw new HttpError(400, 'Choose a supported time window')
  const [running] = await db
    .select()
    .from(leadFetches)
    .where(and(eq(leadFetches.workspaceId, workspaceId), eq(leadFetches.status, 'running')))
    .limit(1)
  if (running) return present(running)
  const [org] = await db.select().from(organisations).where(eq(organisations.id, workspaceId)).limit(1)
  if (!org) throw new HttpError(404, 'Not found')
  const councils = icpCouncils({ coverage: org.coverage, regions: org.targetTerritories, councils: org.councilTargets })
  if (!councils.length) throw new HttpError(409, 'Set your target regions before fetching applications')
  const [created] = await db
    .insert(leadFetches)
    .values({ workspaceId, days, status: 'running', councils, cursor: 0, found: 0, failedCouncils: [], message: '' })
    .returning()
  if (!created) throw new HttpError(500, 'Could not start the fetch')
  return present(created)
}

export async function advanceLeadFetch(workspaceId: string, jobId: string) {
  const [job] = await db.select().from(leadFetches).where(eq(leadFetches.id, jobId)).limit(1)
  if (!job || job.workspaceId !== workspaceId) throw new HttpError(404, 'Not found')
  if (job.status !== 'running') return present(job)
  const slice = job.councils.slice(job.cursor, job.cursor + BATCH)
  const since = new Date(Date.now() - job.days * 24 * 60 * 60 * 1000)
  let found = job.found
  const failed = [...job.failedCouncils]
  for (const council of slice) {
    try {
      const ids = await scanner(council, since)
      if (ids.length) {
        const appRows = await db.select().from(planningApplications).where(inArray(planningApplications.id, ids))
        await Promise.all(
          appRows.map((appRow) => ensureApplicationRowEnriched(appRow, { allowNetwork: true, persist: true })),
        )
        const linked = await db
          .insert(workspaceLeads)
          .values(ids.map((applicationId) => ({ workspaceId, applicationId })))
          .onConflictDoNothing()
          .returning({ id: workspaceLeads.id })
        found += linked.length
      }
    } catch {
      failed.push(council)
    }
  }
  const cursor = job.cursor + slice.length
  const finished = cursor >= job.councils.length
  const status = !finished ? 'running' : failed.length ? 'partial' : found === 0 ? 'empty' : 'succeeded'
  const message = status === 'empty'
    ? (job.days < 7 ? 'No applications in the last 3 days.' : 'No applications in this window.')
    : status === 'partial'
      ? 'Some councils could not be scanned.'
      : ''
  const [updated] = await db
    .update(leadFetches)
    .set({
      cursor,
      found,
      failedCouncils: failed,
      status,
      message,
      updatedAt: new Date(),
      finishedAt: finished ? new Date() : null,
    })
    .where(and(eq(leadFetches.id, job.id), eq(leadFetches.workspaceId, workspaceId)))
    .returning()
  return present(updated ?? job)
}

export async function retryLeadFetch(workspaceId: string, jobId: string) {
  const [job] = await db.select().from(leadFetches).where(eq(leadFetches.id, jobId)).limit(1)
  if (!job || job.workspaceId !== workspaceId) throw new HttpError(404, 'Not found')
  if (job.status !== 'partial' || job.failedCouncils.length === 0) throw new HttpError(409, 'Nothing to retry')
  const [updated] = await db
    .update(leadFetches)
    .set({
      councils: job.failedCouncils,
      cursor: 0,
      failedCouncils: [],
      status: 'running',
      message: '',
      finishedAt: null,
      updatedAt: new Date(),
    })
    .where(and(eq(leadFetches.id, job.id), eq(leadFetches.workspaceId, workspaceId)))
    .returning()
  return present(updated ?? job)
}
