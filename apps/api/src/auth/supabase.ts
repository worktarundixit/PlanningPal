type SupabaseUser = { id: string; email: string; name: string }

export function supabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
}

/** Confirms a Supabase access token. Auth emails stay with Supabase; this only checks the session. */
export async function userFromAccessToken(token: string): Promise<SupabaseUser | null> {
  const url = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY
  if (!url || !anonKey || !token) return null
  const response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
  })
  if (!response.ok) return null
  const body = (await response.json()) as { id?: string; email?: string; user_metadata?: { name?: string; full_name?: string } }
  if (!body.id || !body.email) return null
  return {
    id: body.id,
    email: body.email,
    name: body.user_metadata?.name || body.user_metadata?.full_name || body.email,
  }
}
