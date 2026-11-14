import {
  createHybridPlanningSource,
  createLondonDatahubSource,
  createPlanItSource,
  fetchIdoxContacts,
  recordsToCsv,
  splitPostcode,
  transformRecords,
  type FetchQuery,
  type IngestSourceId,
  type PlanItOptions,
  type PlanItRecord,
  type PlanningSource,
} from '@planningpal/ingest'
import { councilCode, type SourceRecord } from '@planningpal/shared'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { desc, eq, inArray, sql } from 'drizzle-orm'
import { notifyNewLeads } from '../auth/mailer.ts'
import { db } from '../db/client.ts'
import { councils, decisionMakers, ingestCursors, pipelineRuns, planningApplications, rawPayloads } from '../db/schema.ts'
import { enrichSourceRecord, enrichSourceRecords } from './enrich.ts'
import { ENRICH_CURSOR_SOURCE, pageContinues } from './queue.ts'

const dataRoot = process.env.VERCEL
  ? '/tmp/planningpal'
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data')

export type RunOptions = FetchQuery & {
  since?: string
  source?: IngestSourceId
  /** Live portal enrichment. Scheduled runs leave this off and upsert first. */
  enrich?: boolean
  planIt?: Pick<PlanItOptions, 'minIntervalMs' | 'maxRetryWaitMs' | 'maxAttempts'>
}

export type IngestPageSummary = {
  fetched: number
  pageRecords: number
  total: number | null
  from: number
  pageSize: number
  hasMore: boolean
  nextOffset: number
}

function sourceFor(sourceId: IngestSourceId, planIt?: RunOptions['planIt']): PlanningSource {
  if (sourceId === 'london-datahub') return createLondonDatahubSource()
  if (sourceId === 'auto') return createHybridPlanningSource(planIt)
  return createPlanItSource(planIt)
}

function hashFor(authority: string, reference: string) {
  return createHash('sha256').update(`${councilCode(authority)}|${reference}`).digest('hex')
}

function money(value: string) {
  if (!value) return '0.000'
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed.toFixed(3) : '0.000'
}

function sitePostcode(address: string) {
  const match = address.toUpperCase().match(/\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/)
  if (!match?.[1] || !match[2]) return ''
  return `${match[1]} ${match[2]}`
}

function statusFor(stage: string) {
  if (/permit|grant|approv/i.test(stage)) return 'Permitted'
  if (/refus/i.test(stage)) return 'Refused'
  if (/withdraw/i.test(stage)) return 'Withdrawn'
  return stage || 'Undecided'
}

function isoValidationDate(pub: string): string | null {
  if (!pub) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(pub.trim())) return pub.trim()
  const parsed = new Date(`${pub.trim()} UTC`)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

let active: Promise<IngestPageSummary> | null = null

export async function startIngestRun(options: RunOptions) {
  if (active) {
    const error = new Error('A pipeline run is already in progress')
    ;(error as Error & { statusCode?: number }).statusCode = 409
    throw error
  }
  const sourceId: IngestSourceId = options.source ?? 'planit'
  const cursorKey = sourceId === 'london-datahub' ? 'london-datahub' : 'planit'
  const [cursor] = await db.select().from(ingestCursors).where(eq(ingestCursors.source, cursorKey)).limit(1)
  const since = options.since ?? (options.from || options.to || options.authority ? undefined : cursor?.lastDifferent || undefined)
  const query: FetchQuery = {
    recentDays: options.recentDays,
    from: options.from,
    to: options.to,
    authority: options.authority,
    pageSize: options.pageSize,
    maxPages: options.maxPages,
    index: options.index,
    since,
    source: sourceId,
  }
  const [run] = await db.insert(pipelineRuns).values({
    source: sourceId,
    status: 'running',
    cursorBefore: since ?? '',
    options: query,
  }).returning()
  if (!run) throw new Error('Could not start pipeline run')
  const enrich = options.enrich === true
  active = executeRun(run.id, sourceId, cursorKey, query, enrich, options.planIt).finally(() => { active = null })
  return { id: run.id, status: 'running' as const, done: active }
}

async function executeRun(
  runId: string,
  sourceId: IngestSourceId,
  cursorKey: string,
  query: FetchQuery,
  enrich: boolean,
  planIt?: RunOptions['planIt'],
): Promise<IngestPageSummary> {
  const source = sourceFor(sourceId, planIt)
  const rawRecords: PlanItRecord[] = []
  const pageSize = query.pageSize ?? 300
  let lastPage: { records: number; total: number | null; from: number } | null = null
  try {
    let pageNumber = 0
    for await (const page of source.fetchPages(query)) {
      rawRecords.push(...page.records)
      lastPage = { records: page.records.length, total: page.total, from: page.from ?? query.index ?? 0 }
      const rawDir = path.join(dataRoot, 'raw', sourceId, runId)
      await mkdir(rawDir, { recursive: true })
      await writeFile(path.join(rawDir, `page-${String(pageNumber).padStart(3, '0')}.json`), JSON.stringify(page.body))
      await db.insert(rawPayloads).values({ runId, source: sourceId, requestUrl: page.url, body: page.body as Record<string, unknown> })
      pageNumber += 1
    }
    const transformed = transformRecords(rawRecords, undefined, query.since)
    const counts = await upsertRows(transformed.rows)
    let rowsForCsv = transformed.rows
    if (enrich) {
      rowsForCsv = await enrichSourceRecords(transformed.rows)
      await upsertRows(rowsForCsv)
    }
    const csvPath = path.join(dataRoot, 'ingest', `${runId}.csv`)
    await mkdir(path.dirname(csvPath), { recursive: true })
    await writeFile(csvPath, recordsToCsv(rowsForCsv))
    await notifyNewLeads(counts.inserted, counts.titles)
    if (transformed.cursor) {
      await db.insert(ingestCursors).values({ source: cursorKey, lastDifferent: transformed.cursor, updatedAt: new Date() })
        .onConflictDoUpdate({ target: ingestCursors.source, set: { lastDifferent: transformed.cursor, updatedAt: new Date() } })
    }
    await db.update(pipelineRuns).set({
      status: 'succeeded',
      finishedAt: new Date(),
      fetched: transformed.fetched,
      filteredOut: transformed.filteredOut,
      inserted: counts.inserted,
      updated: counts.updated,
      errors: transformed.errors,
      csvPath,
      cursorAfter: transformed.cursor,
    }).where(eq(pipelineRuns.id, runId))
    const from = lastPage?.from ?? query.index ?? 0
    const pageRecords = lastPage?.records ?? 0
    const total = lastPage?.total ?? null
    return {
      fetched: transformed.fetched,
      pageRecords,
      total,
      from,
      pageSize,
      hasMore: pageContinues(pageRecords, total, from, pageSize),
      nextOffset: from + pageRecords,
    }
  } catch (error) {
    await db.update(pipelineRuns).set({
      status: 'failed',
      finishedAt: new Date(),
      errors: Math.max(1, (error as { errors?: number })?.errors || 1),
      message: error instanceof Error ? error.message : 'Pipeline failed',
    }).where(eq(pipelineRuns.id, runId))
    throw error
  }
}

export async function upsertRows(rows: SourceRecord[]) {
  if (!rows.length) return { inserted: 0, updated: 0, titles: [] as string[] }
  const hashes = rows.map((row) => hashFor(row['Local Authority'] ?? '', row['Application Reference'] ?? ''))
  const existing = await db.select({ hash: planningApplications.compositeHash }).from(planningApplications).where(inArray(planningApplications.compositeHash, hashes))
  const known = new Set(existing.map((row) => row.hash))
  const [maxRow] = await db.select({ max: sql<number>`coalesce(max(${planningApplications.sourceIndex}), -1)::int` }).from(planningApplications)
  let nextIndex = (maxRow?.max ?? -1) + 1
  let inserted = 0
  let updated = 0
  const titles: string[] = []
  for (const row of rows) {
    const authority = row['Local Authority'] ?? ''
    const reference = row['Application Reference'] ?? ''
    const hash = hashFor(authority, reference)
    const councilId = await ensureCouncil(row)
    const values = {
      councilId,
      applicationRef: reference,
      compositeHash: hash,
      projectId: row['Project ID'] ?? '',
      heading: row.Heading ?? '',
      proposal: row.Proposal ?? '',
      valueFromM: money(row['£m Value From'] ?? ''),
      valueToM: money(row['£m Value To'] ?? ''),
      estValueFromM: money(row['£m Est Prop Val From'] ?? ''),
      estValueToM: money(row['£m Est Prop Val To'] ?? ''),
      siteRawAddress: row['Site Raw Address'] ?? '',
      siteAddress: row['Site Address'] ?? '',
      siteAddressLine1: row['Site Address'] ?? '',
      siteCounty: row.County ?? '',
      postcode: sitePostcode(row['Site Address'] ?? ''),
      outcode: row['Site Address Postcode Area'] ?? '',
      localAuthority: authority,
      county: row.County ?? '',
      region: row.Region ?? '',
      projectStage: row['Project Stage'] ?? '',
      status: statusFor(row['Project Stage'] ?? ''),
      primaryCategory: row['Project Category'] ?? '',
      propType: row['Prop Type'] ?? '',
      publicationDate: row['Publication Date'] ?? '',
      validationDate: isoValidationDate(row['Publication Date'] ?? ''),
      portalUrl: row['URL Link'] ?? '',
      clientApplicantContact: row['Client Applicant Contact'] ?? '',
      clientApplicant: row['Client Applicant'] ?? '',
      clientApplicantRawAddress: row['Client Applicant Raw Address'] ?? '',
      clientApplicantPhone: row['Client Applicant Phone'] ?? '',
      architectAgentContact: row['Architect Agent Contact'] ?? '',
      architectAgent: row['Architect Agent'] ?? '',
      architectAgentRawAddress: row['Architect Agent Raw Address'] ?? '',
      architectAgentPhone: row['Architect Agent Phone'] ?? '',
      architectAgentEmail: row['Architect Agent Email'] ?? '',
      sourceRecord: row,
      updatedAt: new Date(),
    }
    if (known.has(hash)) {
      const [saved] = await db.update(planningApplications).set(values).where(eq(planningApplications.compositeHash, hash)).returning({ id: planningApplications.id })
      if (saved) await replaceContacts(saved.id, row)
      updated += 1
    } else {
      const [saved] = await db.insert(planningApplications).values({ ...values, sourceIndex: nextIndex }).returning({ id: planningApplications.id })
      nextIndex += 1
      if (saved) await replaceContacts(saved.id, row)
      inserted += 1
      titles.push(row.Heading || reference)
      known.add(hash)
    }
  }
  return { inserted, updated, titles }
}

async function ensureCouncil(row: SourceRecord) {
  const name = row['Local Authority'] || 'Unknown authority'
  const code = councilCode(name)
  const [existing] = await db.select({ id: councils.id }).from(councils).where(eq(councils.code, code)).limit(1)
  if (existing) return existing.id
  const [created] = await db.insert(councils).values({
    code,
    name,
    portalType: 'PLANIT',
    baseUrl: 'https://www.planit.org.uk',
    county: row.County ?? '',
    region: row.Region ?? '',
  }).onConflictDoNothing().returning({ id: councils.id })
  if (created) return created.id
  const [again] = await db.select({ id: councils.id }).from(councils).where(eq(councils.code, code)).limit(1)
  return again?.id
}

export async function replaceContacts(applicationId: string, row: SourceRecord) {
  await db.delete(decisionMakers).where(eq(decisionMakers.applicationId, applicationId))
  const contacts = []
  const architectEmail = row['Architect Agent Email'] ?? ''
  const architectPhone = row['Architect Agent Phone'] ?? ''
  if (row['Architect Agent'] || row['Architect Agent Contact'] || architectEmail || architectPhone) {
    const confidence = architectEmail && architectPhone ? 'VERIFIED_DIRECT' : architectEmail || architectPhone ? 'STUDIO_MATCH' : 'MANUAL_REVIEW'
    contacts.push({
      applicationId,
      role: 'ARCHITECT',
      firmName: row['Architect Agent'] ?? '',
      contactName: row['Architect Agent Contact'] ?? '',
      email: architectEmail,
      phone: architectPhone,
      rawAddress: row['Architect Agent Raw Address'] ?? '',
      postcode: row['Architect Agent Postcode'] ?? '',
      confidenceLevel: confidence,
    })
  }
  if (row['Client Applicant'] || row['Client Applicant Contact']) {
    const clientPhone = row['Client Applicant Phone'] ?? ''
    contacts.push({
      applicationId,
      role: 'APPLICANT',
      firmName: row['Client Applicant'] ?? '',
      contactName: row['Client Applicant Contact'] ?? '',
      email: '',
      phone: clientPhone,
      rawAddress: row['Client Applicant Raw Address'] ?? '',
      postcode: row['Client Applicant Postcode'] ?? '',
      confidenceLevel: clientPhone ? 'STUDIO_MATCH' : 'MANUAL_REVIEW',
    })
  }
  if (contacts.length) await db.insert(decisionMakers).values(contacts)
}

export async function ensureApplicationRowEnriched(
  row: typeof planningApplications.$inferSelect,
  options?: { allowNetwork?: boolean; forcePortalScrape?: boolean; persist?: boolean },
): Promise<typeof planningApplications.$inferSelect> {
  const src = row.sourceRecord ?? {}
  if (!options?.forcePortalScrape && src['Architect Agent Phone'] && src['Architect Agent Email'] && src['Architect Agent Contact']) {
    return row
  }
  const enriched = await enrichSourceRecord(src, {
    allowNetwork: options?.allowNetwork ?? false,
    forcePortalScrape: options?.forcePortalScrape ?? false,
  })
  const updated: typeof planningApplications.$inferSelect = {
    ...row,
    clientApplicantContact: enriched['Client Applicant Contact'] || row.clientApplicantContact,
    clientApplicant: enriched['Client Applicant'] || row.clientApplicant,
    clientApplicantRawAddress: enriched['Client Applicant Raw Address'] || row.clientApplicantRawAddress,
    clientApplicantPhone: enriched['Client Applicant Phone'] || row.clientApplicantPhone,
    architectAgentContact: enriched['Architect Agent Contact'] || row.architectAgentContact,
    architectAgent: enriched['Architect Agent'] || row.architectAgent,
    architectAgentRawAddress: enriched['Architect Agent Raw Address'] || row.architectAgentRawAddress,
    architectAgentPhone: enriched['Architect Agent Phone'] || row.architectAgentPhone,
    architectAgentEmail: enriched['Architect Agent Email'] || row.architectAgentEmail,
    sourceRecord: enriched,
  }
  if (options?.persist !== false) {
    const updateTask = db
      .update(planningApplications)
      .set({
        clientApplicantContact: updated.clientApplicantContact,
        clientApplicant: updated.clientApplicant,
        clientApplicantRawAddress: updated.clientApplicantRawAddress,
        clientApplicantPhone: updated.clientApplicantPhone,
        architectAgentContact: updated.architectAgentContact,
        architectAgent: updated.architectAgent,
        architectAgentRawAddress: updated.architectAgentRawAddress,
        architectAgentPhone: updated.architectAgentPhone,
        architectAgentEmail: updated.architectAgentEmail,
        sourceRecord: enriched,
        updatedAt: new Date(),
      })
      .where(eq(planningApplications.id, row.id))
      .catch(() => undefined)
    if (options?.forcePortalScrape) await updateTask
    else void updateTask
  }
  return updated
}

export async function readRunCsv(runId: string) {
  const [run] = await db.select().from(pipelineRuns).where(eq(pipelineRuns.id, runId)).limit(1)
  if (!run?.csvPath) return null
  const csv = await readFile(run.csvPath, 'utf8')
  return { run, csv }
}

export function presentRun(run: typeof pipelineRuns.$inferSelect) {
  return {
    id: run.id,
    source: run.source,
    status: run.status,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    fetched: run.fetched,
    filteredOut: run.filteredOut,
    inserted: run.inserted,
    updated: run.updated,
    errors: run.status === 'failed' && run.errors === 0 ? 1 : run.errors,
    csvPath: run.csvPath,
    cursorBefore: run.cursorBefore,
    cursorAfter: run.cursorAfter,
    message: run.message,
    options: run.options,
  }
}

async function saveEnrichCursor(lastDifferent: string) {
  await db
    .insert(ingestCursors)
    .values({ source: ENRICH_CURSOR_SOURCE, lastDifferent, updatedAt: new Date() })
    .onConflictDoUpdate({ target: ingestCursors.source, set: { lastDifferent, updatedAt: new Date() } })
}

export async function enrichMissingContacts(options: { limit?: number; fetchImpl?: typeof fetch; deadlineMs?: number } = {}) {
  const limit = Math.min(Math.max(1, options.limit ?? 20), 100)
  const [stored] = await db.select().from(ingestCursors).where(eq(ingestCursors.source, ENRICH_CURSOR_SOURCE)).limit(1)
  let after: { id: string; createdAt: string } | null = null
  if (stored?.lastDifferent) {
    try {
      const parsed = JSON.parse(stored.lastDifferent) as { id?: unknown; createdAt?: unknown }
      if (typeof parsed.id === 'string' && typeof parsed.createdAt === 'string') after = { id: parsed.id, createdAt: parsed.createdAt }
    } catch {
      after = null
    }
  }
  const missing = sql`${planningApplications.portalUrl} ILIKE '%applicationDetails.do%' AND (${planningApplications.architectAgent} = '' OR ${planningApplications.clientApplicant} = '')`
  const resume = after
    ? sql`(${planningApplications.createdAt}, ${planningApplications.id}) < (${after.createdAt}::timestamptz, ${after.id}::uuid)`
    : undefined
  const candidates = await db
    .select()
    .from(planningApplications)
    .where(resume ? sql`${missing} AND ${resume}` : missing)
    .orderBy(desc(planningApplications.createdAt), desc(planningApplications.id))
    .limit(limit)

  let scanned = 0
  let enriched = 0
  let stoppedEarly = false
  for (const app of candidates) {
    if (options.deadlineMs && Date.now() >= options.deadlineMs) {
      stoppedEarly = true
      break
    }
    scanned += 1
    const details = await fetchIdoxContacts(app.portalUrl, { fetchImpl: options.fetchImpl })
    if (!details) continue
    const nextApplicant = details.applicantCompany || details.applicantName || app.clientApplicant
    const nextAgent = details.agentCompany || details.agentName || app.architectAgent
    const nextAgentContact = details.agentName || app.architectAgentContact
    const nextAgentAddress = details.agentAddress || app.architectAgentRawAddress
    const nextApplicantAddress = details.applicantAddress || app.clientApplicantRawAddress
    const nextEmail = details.agentEmail || app.architectAgentEmail
    const nextPhone = details.agentPhone || app.architectAgentPhone
    const updatedSource: SourceRecord = {
      ...app.sourceRecord,
      'Client Applicant': nextApplicant,
      'Client Applicant Contact': details.applicantName || app.sourceRecord['Client Applicant Contact'] || '',
      'Client Applicant Raw Address': nextApplicantAddress,
      'Architect Agent': nextAgent,
      'Architect Agent Contact': nextAgentContact,
      'Architect Agent Raw Address': nextAgentAddress,
      'Architect Agent Email': nextEmail,
      'Architect Agent Phone': nextPhone,
      'Architect Agent Postcode': splitPostcode(nextAgentAddress).postcode,
      'Client Applicant Postcode': splitPostcode(nextApplicantAddress).postcode,
    }
    await db
      .update(planningApplications)
      .set({
        clientApplicant: nextApplicant,
        clientApplicantContact: details.applicantName || app.clientApplicantContact,
        clientApplicantRawAddress: nextApplicantAddress,
        architectAgent: nextAgent,
        architectAgentContact: nextAgentContact,
        architectAgentRawAddress: nextAgentAddress,
        architectAgentEmail: nextEmail,
        architectAgentPhone: nextPhone,
        sourceRecord: updatedSource,
        updatedAt: new Date(),
      })
      .where(eq(planningApplications.id, app.id))
    await replaceContacts(app.id, updatedSource)
    enriched += 1
  }
  const last = scanned > 0 ? candidates[scanned - 1] : undefined
  if (last && (stoppedEarly || candidates.length >= limit)) {
    const createdAt = last.createdAt instanceof Date ? last.createdAt.toISOString() : new Date(last.createdAt).toISOString()
    await saveEnrichCursor(JSON.stringify({ id: last.id, createdAt }))
  } else if (!stoppedEarly) {
    await saveEnrichCursor('')
  }
  return { scanned, enriched }
}
