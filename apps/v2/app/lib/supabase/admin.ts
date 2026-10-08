import { createClient } from '@supabase/supabase-js'

// Server-only admin client — uses service role key, bypasses RLS.
// Never import this in client-side code or expose to the browser.
// Only used inside createServerFn handlers for privileged DB writes.
export function createSupabaseAdminClient() {
  const url = process.env.VITE_SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase admin env vars (VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
  return createClient(url, key)
}
