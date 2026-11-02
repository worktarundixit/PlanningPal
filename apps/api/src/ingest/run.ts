import { recordsToCsv, transformRecords, createPlanItSource, type FetchQuery, type PlanItRecord } from '@planningpal/ingest'
import { councilCode, type SourceRecord } from '@planningpal/shared'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { eq, inArray, sql } from 'drizzle-orm'
import { notifyNewLeads } from '../auth/mailer.ts'
import { db } from '../db/client.ts'
import { councils, decisionMakers, ingestCursors, pipelineRuns, planningApplications, rawPayloads } from '../db/schema.ts'

const dataRoot = process.env.VERCEL
  ? '/tmp/planningpal'
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data')

export type RunOptions = FetchQuery & { since?: string }

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

let active: Promise<void> | null = null

export async function startIngestRun(options: RunOptions) {
  if (active) {
    const error = new Error('A pipeline run is already in progress')
    ;(error as Error & { statusCode?: number }).statusCode = 409
    throw error
  }
  const [cursor] = await db.select().from(ingestCursors).where(eq(ingestCursors.source, 'planit')).limit(1)
  const since = options.since ?? (options.from || options.to || options.authority ? undefined : cursor?.lastDifferent || undefined)
  const query: FetchQuery = { ...options, since }
  const [run] = await db.insert(pipelineRuns).values({
    source: 'planit',
    status: 'running',
    cursorBefore: since ?? '',
    options: query,
  }).returning()
  if (!run) throw new Error('Could not start pipeline run')
  active = executeRun(run.id, query).finally(() => { active = null })
  return { id: run.id, status: 'running' as const, done: active }
}

async function executeRun(runId: string, query: FetchQuery) {
  const source = createPlanItSource()
  const rawRecords: PlanItRecord[] = []
  try {
    let pageNumber = 0
    for await (const page of source.fetchPages(query)) {
      rawRecords.push(...page.records)
      const rawDir = path.join(dataRoot, 'raw', 'planit', runId)
      await mkdir(rawDir, { recursive: true })
      await writeFile(path.join(rawDir, `page-${String(pageNumber).padStart(3, '0')}.json`), JSON.stringify(page.body))
      await db.insert(rawPayloads).values({ runId, source: 'planit', requestUrl: page.url, body: page.body as Record<string, unknown> })
      pageNumber += 1
    }
    const transformed = transformRecords(rawRecords, undefined, query.since)
    const csvPath = path.join(dataRoot, 'ingest', `${runId}.csv`)
    await mkdir(path.dirname(csvPath), { recursive: true })
    await writeFile(csvPath, recordsToCsv(transformed.rows))
    const counts = await upsertRows(transformed.rows)
    await notifyNewLeads(counts.inserted, counts.titles)
    if (transformed.cursor) {
      await db.insert(ingestCursors).values({ source: 'planit', lastDifferent: transformed.cursor, updatedAt: new Date() })
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
  } catch (error) {
    await db.update(pipelineRuns).set({
      status: 'failed',
      finishedAt: new Date(),
      message: error instanceof Error ? error.message : 'Pipeline failed',
    }).where(eq(pipelineRuns.id, runId))
    throw error
  }
}

async function upsertRows(rows: SourceRecord[]) {
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
      portalUrl: row['URL Link'] ?? '',
      clientApplicant: row['Client Applicant'] ?? '',
      clientApplicantRawAddress: row['Client Applicant Raw Address'] ?? '',
      architectAgentContact: row['Architect Agent Contact'] ?? '',
      architectAgent: row['Architect Agent'] ?? '',
      architectAgentRawAddress: row['Architect Agent Raw Address'] ?? '',
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

async function replaceContacts(applicationId: string, row: SourceRecord) {
  await db.delete(decisionMakers).where(eq(decisionMakers.applicationId, applicationId))
  const contacts = []
  if (row['Architect Agent'] || row['Architect Agent Contact']) {
    contacts.push({
      applicationId,
      role: 'ARCHITECT',
      firmName: row['Architect Agent'] ?? '',
      contactName: row['Architect Agent Contact'] ?? '',
      rawAddress: row['Architect Agent Raw Address'] ?? '',
      postcode: row['Architect Agent Postcode'] ?? '',
      confidenceLevel: 'MANUAL_REVIEW',
    })
  }
  if (row['Client Applicant']) {
    contacts.push({
      applicationId,
      role: 'APPLICANT',
      firmName: row['Client Applicant'] ?? '',
      contactName: row['Client Applicant Contact'] ?? '',
      rawAddress: row['Client Applicant Raw Address'] ?? '',
      postcode: row['Client Applicant Postcode'] ?? '',
      confidenceLevel: 'MANUAL_REVIEW',
    })
  }
  if (contacts.length) await db.insert(decisionMakers).values(contacts)
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
    errors: run.errors,
    csvPath: run.csvPath,
    cursorBefore: run.cursorBefore,
    cursorAfter: run.cursorAfter,
    message: run.message,
    options: run.options,
  }
}
