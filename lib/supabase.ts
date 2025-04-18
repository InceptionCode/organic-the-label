import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Server-side Supabase client (for RSC, API routes)
export const createSupabaseServerClient = async (fallbackUrl?: string, options?: object) =>  {
  const cookieStore = await cookies()
  // @ts-expect-error the function itself is not deprecated just a particular usage within the options.
  return createServerClient( 
    process.env.NEXT_PUBLIC_SUPABASE_URL! || fallbackUrl!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
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
)}

// Client-side Supabase (for auth, personalization, etc.)
export const createSupabaseBrowserClient = (fallbackUrl?: string) =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || fallbackUrl!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
