import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Browser Supabase client. Auth emails are sent by Supabase, not by Resend. */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null

export async function accessToken() {
  if (!supabase) return ''
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? ''
}
