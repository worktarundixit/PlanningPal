import Fastify, { type FastifyInstance } from 'fastify'
import { permissionFor } from './auth/permissions.ts'
import { loadSession } from './auth/session.ts'
import { HttpError } from './lib/http.ts'
import { campaignRoutes } from './routes/campaigns.ts'
import { crmRoutes } from './routes/crm.ts'
import { inboxRoutes } from './routes/inbox.ts'
import { planningRoutes } from './routes/planning.ts'
import { telemetryRoutes } from './routes/telemetry.ts'
import { ingestRoutes } from './routes/ingest.ts'
import { workspaceRoutes } from './routes/workspace.ts'
import './types.ts'

function trustedOrigin(origin: string | undefined) {
  if (!origin) return null
  const allowed = [
    process.env.WEB_ORIGIN,
    'http://127.0.0.1:5173',
    'http://localhost:5173',
    'http://127.0.0.1:3001',
    'http://localhost:3001',
  ].filter((value): value is string => Boolean(value))
  return allowed.some((value) => origin === value.replace(/\/$/, '')) ? origin : null
}

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: false })

  app.removeContentTypeParser('application/json')
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (request, body, done) => {
    try {
      const text = typeof body === 'string' ? body : body.toString('utf8')
      request.rawBody = text
      done(null, text.length ? JSON.parse(text) : {})
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Invalid JSON')
      done(err, undefined)
    }
  })

  app.addHook('onRequest', async (request, reply) => {
    const origin = trustedOrigin(typeof request.headers.origin === 'string' ? request.headers.origin : undefined)
    if (origin) {
      reply.header('Access-Control-Allow-Origin', origin)
      reply.header('Access-Control-Allow-Credentials', 'true')
      reply.header('Vary', 'Origin')
    } else {
      reply.header('Access-Control-Allow-Origin', '*')
    }
    reply.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-AEC-Signature, X-Organisation-Id')
    reply.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS')
    request.user = null
    if (request.method === 'OPTIONS') return reply.code(204).send()
  })

  app.addHook('preHandler', async (request, reply) => {
    const path = request.url.split('?')[0] || request.url
    if (request.routeOptions.config.public) return
    const permission = permissionFor(request.method, path)
    if (permission === 'public') return
    const user = await loadSession(request)
    if (!user) return reply.code(401).send({ error: 'Unauthorized' })
    request.user = user
    if (permission === 'deny' || !user.permissions.includes(permission)) {
      return reply.code(403).send({ error: 'Forbidden' })
    }
  })

  app.setErrorHandler((error: unknown, request, reply) => {
    if (error instanceof HttpError) return reply.code(error.statusCode).send({ error: error.message })
    const statusCode =
      typeof error === 'object' && error !== null && 'statusCode' in error && typeof error.statusCode === 'number'
        ? error.statusCode
        : 500
    if (statusCode >= 500) request.log.error(error)
    const message = statusCode >= 500 ? 'Internal server error' : error instanceof Error ? error.message : 'Request failed'
    return reply.code(statusCode).send({ error: message })
  })

  app.get('/api/v1/health', { config: { public: true } }, async () => ({
    ok: true,
    service: 'planningpal-api',
  }))

  app.get('/api/v1/auth/providers', { config: { public: true } }, async () => ({
    email: true,
    magicLink: true,
    google: true,
  }))

  app.register(planningRoutes)
  app.register(crmRoutes)
  app.register(inboxRoutes)
  app.register(campaignRoutes)
  app.register(workspaceRoutes)
  app.register(ingestRoutes)
  app.register(telemetryRoutes)

  return app
}
