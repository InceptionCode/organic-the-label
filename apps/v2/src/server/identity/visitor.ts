import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseAdminClient } from '~/server/supabase/admin'
import { isBot } from './bots'

export const ANON_COOKIE = 'anon_token'
const ONE_YEAR = 60 * 60 * 24 * 365

export type VisitorCookieOptions = {
  httpOnly: boolean
  sameSite: 'lax'
  secure: boolean
  path: string
  maxAge: number
}

export type EnsureVisitorInput = {
  getCookie: (name: string) => string | undefined
  setCookie: (name: string, value: string, options: VisitorCookieOptions) => void
  userAgent: string | null | undefined
  // False only on http://localhost.
  secure?: boolean
}

// Lazily creates the anonymous visitor. Call only from the tracking endpoint and stateful
// anonymous actions, never from loaders, beforeLoad, or middleware.
export async function ensureVisitor(
  { getCookie, setCookie, userAgent, secure = true }: EnsureVisitorInput,
  client: SupabaseClient = createSupabaseAdminClient(),
): Promise<{ id: string } | null> {
  if (isBot(userAgent)) return null

  const existing = getCookie(ANON_COOKIE)
  const anonToken = existing || crypto.randomUUID()

  const { data, error } = await client
    .from('anonymous_visitors')
    .upsert({ anon_token: anonToken, last_seen_at: new Date().toISOString() }, { onConflict: 'anon_token' })
    .select('id')
    .single()
  if (error || !data) throw new Error(`ensureVisitor failed: ${error?.message ?? 'no row'}`)

  if (!existing) {
    setCookie(ANON_COOKIE, anonToken, { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: ONE_YEAR })
  }
  return { id: data.id as string }
}
