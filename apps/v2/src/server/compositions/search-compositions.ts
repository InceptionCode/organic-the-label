import type { SupabaseClient } from '@supabase/supabase-js'
import { getCached } from '~/server/cache/redis'
import { keys, ttl } from '~/server/cache/keys'
import { createSupabasePublicClient } from '~/server/supabase/server'
import { compositionSearchFilter, normalizeSearchQuery } from '~/lib/search-query'
import { COMPOSITION_LIST_COLUMNS, type CompositionListItem } from './columns'

/**
 * Active compositions whose title or description contains q, or whose tags contain it, newest
 * first (pages/search.md). Cached under compositions:search:{normalized q}; empty results and
 * errors are not cached.
 */
export async function searchCompositions(
  q: string,
  { limit = 12, client = createSupabasePublicClient }: { limit?: number; client?: () => SupabaseClient } = {},
): Promise<CompositionListItem[]> {
  const filter = compositionSearchFilter(q)
  if (!filter) return []
  return getCached(keys.compositionsSearch(normalizeSearchQuery(q)), ttl.search, async () => {
    const { data, error } = await client()
      .from('compositions')
      .select(COMPOSITION_LIST_COLUMNS)
      .eq('active', true)
      .or(filter)
      .order('posted_at', { ascending: false })
      .limit(limit)
    if (error) throw new Error(`composition search failed: ${error.message}`)
    return (data ?? []) as unknown as CompositionListItem[]
  })
}
