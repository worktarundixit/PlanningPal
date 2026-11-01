import type { FastifyReply, FastifyRequest } from 'fastify'
import type { ZodType } from 'zod'
import type { AuthUser } from '../types.ts'

export class HttpError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
  }
}

export function requireUser(request: FastifyRequest): AuthUser {
  if (!request.user) throw new HttpError(401, 'Unauthorized')
  return request.user
}

export function parseBody<T>(schema: ZodType<T>, body: unknown, reply: FastifyReply): T | undefined {
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    void reply.code(400).send({ error: 'Invalid request', details: parsed.error.flatten() })
    return undefined
  }
  return parsed.data
}

export function parseQuery<T>(schema: ZodType<T>, query: unknown, reply: FastifyReply): T | undefined {
  return parseBody(schema, query, reply)
}
