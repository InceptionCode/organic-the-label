import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { env } from '~/server/env'

export type { CookieOptions }

export type CookieAdapter = {
  getAll(): { name: string; value: string }[]
  // headers carries the no-store cache headers @supabase/ssr sends with auth cookie writes.
  setAll(
    list: { name: string; value: string; options: CookieOptions }[],
    headers?: Record<string, string>,
  ): void
}

// Request-scoped: create one per request, never share across requests.
export function createSupabaseServerClient(cookies: CookieAdapter) {
  return createServerClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookies.getAll(),
      setAll: (list, headers) => cookies.setAll(list, headers),
    },
  })
}

// Cookie-less client for calls that only send email (signUp, OTP, password reset). Using the
// cookie client here would write a PKCE verifier cookie that the session middleware would then read.
export function createSupabasePublicClient() {
  return createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, flowType: 'implicit' },
  })
}
