import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/* WARNING: Implementation can't be used with Next.js 16 Cache changes if caching is needed. Use "createClient" instead. 
  * THIS MEANS you:
 ❌ do NOT import cookies here
 ❌ do NOT create a Supabase client that uses cookies
 ❌ do NOT read request headers

 - MAKE SURE ROUTE IS AS SECURE AS POSSIBLE BEFORE USING "createClient"
*/

// Server-side Supabase client (for RSC, API routes)

// @deprecated: Old implementation for Next.js >= 15
export type FetchSupabaseOptions = {
  cacheOptions: Pick<RequestInit, "next" | "cache">
}

const fetchSupabase =
  (options: Pick<RequestInit, "next" | "cache">) =>
    (url: RequestInfo | URL, init?: RequestInit) => {
      return fetch(url, {
        ...init,
        ...options,
      });
    };

export const createSupabaseServerClient = async (fallbackUrl?: string, options?: FetchSupabaseOptions) => {
  const cookieStore = await cookies()
  // @ts-expect-error the function itself is not deprecated just a particular usage within the options.
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || fallbackUrl!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: fetchSupabase(options?.cacheOptions || {}),
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: []) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      ...options
    }
  )
}
