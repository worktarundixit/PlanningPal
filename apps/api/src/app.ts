import Fastify, { type FastifyInstance } from 'fastify'
import { permissionFor } from './auth/permissions.ts'
import { loadSession } from './auth/session.ts'
import { HttpError } from './lib/http.ts'
import { allowRequest } from './lib/rateLimit.ts'
import { campaignRoutes } from './routes/campaigns.ts'
import { campaignProviderRoutes } from './routes/campaignProvider.ts'
import { crmRoutes } from './routes/crm.ts'
import { inboxRoutes } from './routes/inbox.ts'
import { planningRoutes } from './routes/planning.ts'
import { telemetryRoutes } from './routes/telemetry.ts'
import { ingestRoutes } from './routes/ingest.ts'
import { leadFetchRoutes } from './routes/leadFetches.ts'
import { lpaRoutes } from './routes/lpas.ts'
import { onboardingRoutes } from './routes/onboarding.ts'
import { workspaceRoutes } from './routes/workspace.ts'
import './types.ts'

function publicLimit(method: string, path: string) {
  if (path === '/api/v1/health' || path === '/api/v1/auth/providers') return 120
  if (method === 'POST' && path === '/api/v1/demo-requests') return 10
  if (method === 'POST' && path === '/api/v1/telemetry/event') return 60
  if (method === 'POST' && path.startsWith('/api/v1/campaign-events/')) return 120
  if (method === 'GET' && /^\/api\/v1\/team\/invites\/[^/]+$/.test(path)) return 30
  return null
}

function workspaceOptional(method: string, path: string) {
  if (path === '/api/v1/me' || path.startsWith('/api/v1/onboarding') || path.startsWith('/api/v1/lpas') || path.startsWith('/api/v1/ingest/') || path.startsWith('/api/v1/campaign-provider')) return true
  if (method === 'GET' && (path === '/api/v1/planning/leads' || /^\/api\/v1\/planning\/leads\/[^/]+$/.test(path))) return true
  return false
}

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
    reply.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-AEC-Signature, X-Organisation-Id, X-Workspace-Id')
    reply.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS')
    request.user = null
    if (request.method === 'OPTIONS') return reply.code(204).send()
    const path = request.url.split('?')[0] || request.url
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      const requestOrigin = typeof request.headers.origin === 'string' ? request.headers.origin : undefined
      if (requestOrigin && !trustedOrigin(requestOrigin)) return reply.code(403).send({ error: 'Forbidden' })
    }
    const limit = publicLimit(request.method, path)
    if (limit) {
      const forwarded = request.headers['x-forwarded-for']
      const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim() || request.ip || 'local'
      if (!allowRequest(`${ip}:${path}`, limit, 60_000)) return reply.code(429).send({ error: 'Too many requests. Try again shortly.' })
    }
  })

  app.addHook('preHandler', async (request, reply) => {
    const path = request.url.split('?')[0] || request.url
    if (request.routeOptions.config.public) return
    const permission = permissionFor(request.method, path)
    if (permission === 'public') return
    const user = await loadSession(request)
    if (request.missingWorkspace) return reply.code(404).send({ error: 'Not found' })
    if (!user) return reply.code(401).send({ error: 'Unauthorized' })
    request.user = user
    if (permission === 'deny' || !user.permissions.includes(permission)) {
      return reply.code(403).send({ error: 'Forbidden' })
    }
    if (!user.organisationId && !workspaceOptional(request.method, path)) {
      return reply.code(404).send({ error: 'Not found' })
    }
  })

  app.setErrorHandler((error: unknown, request, reply) => {
    if (error instanceof HttpError) return reply.code(error.statusCode).send({ error: error.message })
    const statusCode =
      typeof error === 'object' && error !== null && 'statusCode' in error && typeof error.statusCode === 'number'
        ? error.statusCode
        : 500
    if (statusCode >= 500) {
      const raw = error instanceof Error ? error.message : 'request failed'
      request.log.error({ statusCode, path: request.url.split('?')[0], message: raw.replace(/[\w.+-]+@[\w.-]+/g, '[redacted]') }, 'request failed')
    }
    const message = statusCode >= 500 ? 'Something went wrong. Please try again.' : 'That request could not be completed.'
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
  app.register(campaignProviderRoutes)
  app.register(workspaceRoutes)
  app.register(onboardingRoutes)
  app.register(ingestRoutes)
  app.register(leadFetchRoutes)
  app.register(lpaRoutes)
  app.register(telemetryRoutes)

  return app
}
