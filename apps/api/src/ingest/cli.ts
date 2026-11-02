import type { IngestSourceId } from '@planningpal/ingest'
import { sqlClient } from '../db/client.ts'
import { runMigrations } from '../db/migrate.ts'
import { enrichMissingContacts, startIngestRun } from './run.ts'

function arg(name: string) {
  const index = process.argv.indexOf(`--${name}`)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

const from = arg('from')
const to = arg('to')
const authority = arg('authority')
const recent = arg('recent')
const maxPages = arg('max-pages')
const rawSource = arg('source')
const enrich = process.argv.includes('--enrich')
const enrichLimit = arg('enrich-limit')
const source: IngestSourceId = rawSource === 'london-datahub' || rawSource === 'auto' ? rawSource : 'planit'

await runMigrations()
const started = await startIngestRun({
  from,
  to,
  authority,
  recentDays: recent ? Number(recent) : from || to ? undefined : 3,
  maxPages: maxPages ? Number(maxPages) : undefined,
  source,
})
await started.done
console.log(`Ingestion run ${started.id} (${source}) finished`)
if (enrich) {
  const result = await enrichMissingContacts({ limit: enrichLimit ? Number(enrichLimit) : 30 })
  console.log(`Idox contact enrichment finished: ${result.enriched}/${result.scanned} applications enriched`)
}
await sqlClient.end()
