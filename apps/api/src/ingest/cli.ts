import { sqlClient } from '../db/client.ts'
import { runMigrations } from '../db/migrate.ts'
import { startIngestRun } from './run.ts'

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

await runMigrations()
const started = await startIngestRun({
  from,
  to,
  authority,
  recentDays: recent ? Number(recent) : from || to ? undefined : 3,
  maxPages: maxPages ? Number(maxPages) : undefined,
})
await started.done
console.log(`PlanIt run ${started.id} finished`)
await sqlClient.end()
