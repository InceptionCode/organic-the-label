import { createBrowserClient } from '@supabase/ssr'

// The only src/server module the client may load, and only via dynamic import().
// It must not import server/env.ts so no secret ends up in a client chunk.
let client: ReturnType<typeof createBrowserClient> | undefined

export function getSupabaseBrowserClient(url: string, anonKey: string) {
  client ??= createBrowserClient(url, anonKey)
  return client
}
