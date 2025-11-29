import { createClient } from "@supabase/supabase-js";

/* WARNING: Implementation does not support the following: 
 ❌ do NOT import cookies here
 ❌ do NOT create a Supabase client that uses cookies
 ❌ do NOT read request headers

 - MAKE SURE ROUTE IS AS SECURE AS POSSIBLE BEFORE USING "createClient" -
 - ONLY USE FOR CACHING PURPOSES ON PUBLIC ROUTES [ANON ONLY] -
*/

// Supabase client (for RSC, API routes public NON RLS)


export const createSupabasePublicClient = (fallbackUrl?: string) =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || fallbackUrl!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );