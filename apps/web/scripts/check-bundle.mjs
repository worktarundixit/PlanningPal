import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
const banned = [
  /instantly/i,
  /aecpipeline/i,
  /service_role/i,
  /SUPABASE_SERVICE_ROLE/,
  /CAMPAIGN_KEY_ENCRYPTION_SECRET/,
  /CAMPAIGN_WEBHOOK_SECRET/,
  /RESEND_API_KEY/,
]

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      await walk(full)
      continue
    }
    const text = (await readFile(full)).toString('utf8')
    if (banned.some((pattern) => pattern.test(text))) {
      console.error(`Secret or forbidden name found in ${path.relative(root, full)}`)
      process.exit(1)
    }
  }
}

await walk(root)
console.log('Web build does not name the campaign provider')
