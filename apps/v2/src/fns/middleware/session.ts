import { createMiddleware } from '@tanstack/react-start'
import { getCookies } from '@tanstack/react-start/server'
import type { JwtPayload } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '~/server/supabase/server'
import { tanstackCookieAdapter } from '~/fns/cookies'

export type Claims = JwtPayload

export function hasAuthCookie(cookies: Record<string, string>): boolean {
  return Object.keys(cookies).some((name) => name.startsWith('sb-') && name.includes('-auth-token'))
}

// Anonymous visitors and bots (no sb-*-auth-token cookie) never touch Supabase.
export const supabaseSession = createMiddleware().server(async ({ next }) => {
  if (!hasAuthCookie(getCookies())) return next({ context: { claims: null as Claims | null } })
  const { data } = await createSupabaseServerClient(tanstackCookieAdapter()).auth.getClaims()
  const claims = data?.claims && !data.claims.is_anonymous ? data.claims : null
  return next({ context: { claims: claims as Claims | null } })
})
