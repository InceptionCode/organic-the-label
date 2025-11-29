import { createBrowserClient } from '@supabase/ssr'
// Client-side Supabase (for auth, personalization, etc.)
export const createSupabaseBrowserClient = (fallbackUrl?: string) =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || fallbackUrl!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )