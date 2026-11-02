import postgres from 'postgres'

const LOCAL_DEFAULT = 'postgres://planningpal:planningpal@localhost:5432/planningpal'

export type ConnectionRole = 'pooled' | 'direct'

export type ConnectionPlan = {
  role: ConnectionRole
  /** True when the client must talk to a transaction-mode pooler (Supabase port 6543 or PgBouncer). */
  pooled: boolean
  connectionString: string
  options: {
    max: number
    prepare: boolean
    ssl: false | 'require' | 'verify-full'
    idle_timeout: number
    connect_timeout: number
  }
}

export function resolveDatabaseUrls(env: NodeJS.ProcessEnv = process.env) {
  const pooled = env.DATABASE_URL?.trim() || LOCAL_DEFAULT
  const direct = env.DIRECT_DATABASE_URL?.trim() || pooled
  return { pooled, direct }
}

function sslMode(url: URL) {
  return (url.searchParams.get('sslmode') || '').toLowerCase()
}

export function isPoolerUrl(connectionString: string) {
  const url = new URL(connectionString)
  return (
    url.hostname.includes('-pooler') ||
    url.hostname.includes('pooler.supabase.com') ||
    url.port === '6543' ||
    url.searchParams.get('pgbouncer') === 'true'
  )
}

function sslOption(url: URL): ConnectionPlan['options']['ssl'] {
  const mode = sslMode(url)
  if (mode === 'verify-full' || mode === 'verify-ca') return 'verify-full'
  if (mode === 'require' || mode === 'prefer' || mode === 'allow') return 'require'
  if (mode === 'disable') return false
  // Neon and Supabase always require TLS, including their pooler hostnames.
  if (
    url.hostname.endsWith('.neon.tech') ||
    url.hostname.endsWith('.supabase.co') ||
    url.hostname.includes('-pooler') ||
    url.hostname.includes('pooler.supabase.com')
  ) {
    return 'require'
  }
  return false
}

/**
 * Build postgres.js settings for the Supabase transaction pooler or a direct session.
 * Prepared statements are disabled for the pooler: transaction mode rejects named prepares.
 * sslmode=require encrypts without verifying the CA.
 */
export function planConnection(connectionString: string, role: ConnectionRole, env: NodeJS.ProcessEnv = process.env): ConnectionPlan {
  let url: URL
  try {
    url = new URL(connectionString)
  } catch {
    throw new Error(`Invalid ${role === 'direct' ? 'DIRECT_DATABASE_URL' : 'DATABASE_URL'}`)
  }

  // Node drivers do not implement channel binding. Neon’s dashboard sometimes appends it.
  url.searchParams.delete('channel_binding')

  const hostIsPooler = isPoolerUrl(url.toString())
  const urlsDiffer = Boolean(env.DIRECT_DATABASE_URL?.trim()) && env.DIRECT_DATABASE_URL?.trim() !== env.DATABASE_URL?.trim()
  const pooled = role === 'pooled' ? hostIsPooler || urlsDiffer : hostIsPooler
  const requestedMax = Number(env.DATABASE_POOL_MAX || 10)
  const max = role === 'direct' ? 1 : Number.isFinite(requestedMax) && requestedMax > 0 ? requestedMax : 10

  return {
    role,
    pooled,
    connectionString: url.toString(),
    options: {
      max,
      prepare: !pooled,
      ssl: sslOption(url),
      idle_timeout: 20,
      connect_timeout: 30,
    },
  }
}

export function createSql(role: ConnectionRole, env: NodeJS.ProcessEnv = process.env): postgres.Sql {
  const urls = resolveDatabaseUrls(env)
  const plan = planConnection(role === 'direct' ? urls.direct : urls.pooled, role, env)
  return postgres(plan.connectionString, plan.options)
}
