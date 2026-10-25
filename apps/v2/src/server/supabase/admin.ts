import { createClient } from '@supabase/supabase-js'
import { env } from '~/server/env'

// Bypasses RLS. Only call from named services (visitor, merge, entitlements, signed URLs).
export function createSupabaseAdminClient() {
  return createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
