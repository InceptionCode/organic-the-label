import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client (for RSC, API routes)
export const supabaseServer = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Only used in secure server contexts
)

// Client-side Supabase (for auth, personalization, etc.)
export const createSupabaseBrowser = (fallbackUrl?: string) =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || fallbackUrl!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
