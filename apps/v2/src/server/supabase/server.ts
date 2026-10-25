import { createServerClient, type CookieOptions } from '@supabase/ssr'
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
