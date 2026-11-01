import { eq } from 'drizzle-orm'
import Fastify, { type FastifyInstance } from 'fastify'
import { db } from './db/client.ts'
import { clients, users } from './db/schema.ts'
import { HttpError } from './lib/http.ts'
import { campaignRoutes } from './routes/campaigns.ts'
import { crmRoutes } from './routes/crm.ts'
import { inboxRoutes } from './routes/inbox.ts'
import { planningRoutes } from './routes/planning.ts'
import { telemetryRoutes } from './routes/telemetry.ts'
import { ingestRoutes } from './routes/ingest.ts'
import { workspaceRoutes } from './routes/workspace.ts'
import './types.ts'
import type { AuthUser } from './types.ts'

async function userFromToken(token: string): Promise<AuthUser | null> {
  const [row] = await db
    .select({ user: users, companyName: clients.companyName })
    .from(users)
    .innerJoin(clients, eq(users.clientId, clients.id))
    .where(eq(users.apiToken, token))
    .limit(1)
  if (!row) return null
  return {
    id: row.user.id,
    clientId: row.user.clientId,
    email: row.user.email,
    name: row.user.name,
    jobTitle: row.user.jobTitle,
    companyName: row.companyName,
    twoFactorEnabled: row.user.twoFactorEnabled,
    apiToken: row.user.apiToken,
  }
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
    reply.header('Access-Control-Allow-Origin', '*')
    reply.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-AEC-Signature')
    reply.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS')
    request.user = null
    if (request.method === 'OPTIONS') {
      return reply.code(204).send()
    }
  })

  app.addHook('preHandler', async (request, reply) => {
    if (request.routeOptions.config.public) return
    const header = request.headers.authorization
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : ''
    if (token) {
      const user = await userFromToken(token)
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })
      request.user = user
      return
    }
    if ((process.env.AUTH_MODE ?? 'dev') !== 'strict') {
      const demo = await userFromToken(process.env.DEMO_USER_TOKEN || 'dev-token')
      if (!demo) return reply.code(401).send({ error: 'Unauthorized', hint: 'Seed the demo user or send a bearer token' })
      request.user = demo
      return
    }
    return reply.code(401).send({ error: 'Unauthorized' })
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

  app.register(planningRoutes)
  app.register(crmRoutes)
  app.register(inboxRoutes)
  app.register(campaignRoutes)
  app.register(workspaceRoutes)
  app.register(ingestRoutes)
  app.register(telemetryRoutes)

  return app
}
