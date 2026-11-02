/** Production sign-in. `supabase` is the Vercel value; `strict` is the same rule in tests. */
export function isProductionAuth(env: NodeJS.ProcessEnv = process.env) {
  const mode = (env.AUTH_MODE ?? 'dev').trim().toLowerCase()
  return mode === 'supabase' || mode === 'strict'
}
