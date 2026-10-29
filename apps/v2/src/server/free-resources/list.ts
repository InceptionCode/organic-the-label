import type { SupabaseClient } from '@supabase/supabase-js'
import { getCached } from '~/server/cache/redis'
import { keys, ttl } from '~/server/cache/keys'
import { createSupabaseAdminClient } from '~/server/supabase/admin'

export type FreeResourceListItem = { slug: string; name: string; description: string | null }

/**
 * Active free resources (public columns only) for /explore, featured first. Admin client inside a
 * named service for v1 parity (pages/free.md). Cached under free-resources:list, busted by
 * apps/api with free-resources:*; empty lists and errors are not cached.
 */
export async function listFreeResources(
  limit = 6,
  client: () => SupabaseClient = createSupabaseAdminClient,
): Promise<FreeResourceListItem[]> {
  return getCached(keys.freeResourcesList(), ttl.freeResources, async () => {
    const { data, error } = await client()
      .from('free_resources')
      .select('slug, name, description')
      .eq('active', true)
      .order('featured', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(limit)
    if (error) throw new Error(`free resources list query failed: ${error.message}`)
    return (data ?? []).map((row: { slug: string; name: string; description: string | null }) => ({
      slug: row.slug,
      name: row.name,
      description: row.description ?? null,
    }))
  })
}
