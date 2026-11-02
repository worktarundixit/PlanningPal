import { build } from 'esbuild'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

await mkdir(path.join(root, 'api/cron'), { recursive: true })

const shared = {
  absWorkingDir: root,
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  sourcemap: false,
  legalComments: 'none',
  packages: 'bundle',
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
}

await build({
  ...shared,
  entryPoints: [path.join(root, 'server/catch-all.ts')],
  outfile: path.join(root, 'api/gateway.js'),
})

await build({
  ...shared,
  entryPoints: [path.join(root, 'server/cron-ingest.ts')],
  outfile: path.join(root, 'api/cron/ingest.js'),
})

console.log('Bundled Vercel functions into apps/web/api')
