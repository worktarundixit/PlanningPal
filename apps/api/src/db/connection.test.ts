import { describe, expect, it } from 'vitest'
import { isPoolerUrl, planConnection, resolveDatabaseUrls } from './connection.ts'

const local = 'postgres://planningpal:planningpal@localhost:5432/planningpal'
const pooledNeon =
  'postgresql://planningpal:secret@ep-cool-darkness-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
const directNeon = 'postgresql://planningpal:secret@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require'

describe('database connection plan', () => {
  it('uses one local URL for docker-compose when the direct URL is omitted', () => {
    expect(resolveDatabaseUrls({ DATABASE_URL: local })).toEqual({ pooled: local, direct: local })
    const plan = planConnection(local, 'pooled', { DATABASE_URL: local })
    expect(plan.pooled).toBe(false)
    expect(plan.options.prepare).toBe(true)
    expect(plan.options.ssl).toBe(false)
    expect(plan.options.max).toBe(10)
  })

  it('requires TLS and disables prepared statements for the Neon pooler', () => {
    const plan = planConnection(pooledNeon, 'pooled', { DATABASE_URL: pooledNeon, DIRECT_DATABASE_URL: directNeon })
    expect(isPoolerUrl(pooledNeon)).toBe(true)
    expect(plan.pooled).toBe(true)
    expect(plan.options.prepare).toBe(false)
    expect(plan.options.ssl).toBe('require')
    expect(plan.options.max).toBe(10)
    expect(plan.connectionString).not.toContain('channel_binding')
    expect(plan.connectionString).toContain('sslmode=require')
  })

  it('keeps prepared statements on the direct Neon URL used for migrations', () => {
    const plan = planConnection(directNeon, 'direct', { DATABASE_URL: pooledNeon, DIRECT_DATABASE_URL: directNeon })
    expect(plan.pooled).toBe(false)
    expect(plan.options.prepare).toBe(true)
    expect(plan.options.ssl).toBe('require')
    expect(plan.options.max).toBe(1)
  })

  it('treats differing URLs as a pooler even without a -pooler hostname', () => {
    const custom = 'postgres://planningpal:secret@pool.internal:5432/neondb?sslmode=require'
    const plan = planConnection(custom, 'pooled', { DATABASE_URL: custom, DIRECT_DATABASE_URL: directNeon })
    expect(plan.pooled).toBe(true)
    expect(plan.options.prepare).toBe(false)
    expect(plan.options.ssl).toBe('require')
  })

  it('honours sslmode=verify-full and pgbouncer=true', () => {
    const url = 'postgres://planningpal:secret@db.internal:5432/neondb?sslmode=verify-full&pgbouncer=true'
    const plan = planConnection(url, 'pooled', { DATABASE_URL: url })
    expect(plan.pooled).toBe(true)
    expect(plan.options.ssl).toBe('verify-full')
    expect(plan.options.prepare).toBe(false)
  })

  it('forces SSL for a Neon host that forgot sslmode', () => {
    const url = 'postgres://planningpal:secret@ep-plain.us-east-2.aws.neon.tech/neondb'
    const plan = planConnection(url, 'direct', { DATABASE_URL: url, DIRECT_DATABASE_URL: url })
    expect(plan.options.ssl).toBe('require')
    expect(plan.options.prepare).toBe(true)
  })
})
