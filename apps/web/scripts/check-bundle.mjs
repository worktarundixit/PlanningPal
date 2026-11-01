import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
const banned = /instantly/i

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      await walk(full)
      continue
    }
    const text = await readFile(full)
    if (banned.test(text.toString('utf8'))) {
      console.error(`Campaign provider name found in ${path.relative(root, full)}`)
      process.exit(1)
    }
  }
}

await walk(root)
console.log('Web build does not name the campaign provider')
