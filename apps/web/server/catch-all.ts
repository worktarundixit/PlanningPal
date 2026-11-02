import { buildApp } from '../../api/src/app.ts'
import type { IncomingMessage, ServerResponse } from 'node:http'

let ready: ReturnType<typeof buildApp> | undefined

async function app() {
  if (!ready) {
    ready = buildApp()
    await ready.ready()
  }
  return ready
}

/**
 * Vercel’s filesystem router only matches one segment of a non-Next catch-all.
 * Rewrites send `/api/v1/...` here and keep the original path in `__pp_path`.
 */
function restorePath(request: IncomingMessage) {
  const raw = request.url || '/'
  let url: URL
  try {
    url = new URL(raw, 'http://localhost')
  } catch {
    return
  }
  const original = url.searchParams.get('__pp_path')
  if (!original || !original.startsWith('/api/') || original.includes('..')) return
  url.searchParams.delete('__pp_path')
  const query = url.searchParams.toString()
  request.url = query ? `${original}?${query}` : original
}

/** Serves the Fastify API as one Vercel Function under /api. */
export default async function handler(request: IncomingMessage, response: ServerResponse) {
  restorePath(request)
  const instance = await app()
  instance.server.emit('request', request, response)
}
