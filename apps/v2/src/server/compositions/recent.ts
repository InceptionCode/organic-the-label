import type { SupabaseClient } from '@supabase/supabase-js'
import { getCached } from '~/server/cache/redis'
import { keys, ttl } from '~/server/cache/keys'
import { createSupabasePublicClient } from '~/server/supabase/server'
import { COMPOSITION_LIST_COLUMNS, type CompositionListItem } from './columns'

/**
 * Newest active compositions for /explore. Anon client (RLS compositions_public_read allows
 * active rows). Cached under compositions:recent:{n}, busted by apps/api with compositions:*.
 * Empty results and errors are never cached.
 */
export async function getRecentCompositions(
  limit: number,
  client: () => SupabaseClient = createSupabasePublicClient,
): Promise<CompositionListItem[]> {
  return getCached(keys.compositionsRecent(limit), ttl.compositions, async () => {
    const { data, error } = await client()
      .from('compositions')
      .select(COMPOSITION_LIST_COLUMNS)
      .eq('active', true)
      .order('posted_at', { ascending: false })
      .limit(limit)
    if (error) throw new Error(`recent compositions query failed: ${error.message}`)
    return (data ?? []) as unknown as CompositionListItem[]
  })
}
