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

/** Serves the existing Fastify API as one Vercel Function under /api. */
export default async function handler(request: IncomingMessage, response: ServerResponse) {
  const instance = await app()
  instance.server.emit('request', request, response)
}
