import type { SupabaseClient } from '@supabase/supabase-js'
import { COMPOSITION_PAGE_COUNT } from '@organic/content-schema'
import { getCached } from '~/server/cache/redis'
import { keys, ttl } from '~/server/cache/keys'
import { createSupabasePublicClient } from '~/server/supabase/server'
import {
  compositionListSignature,
  rangeCutoffISO,
  sanitizeCompositionSearch,
  type CompositionListParams,
} from '~/lib/composition-search'
import { COMPOSITION_LIST_COLUMNS, type CompositionListItem } from './columns'

export type ListCompositionsDeps = { client?: () => SupabaseClient; now?: () => Date; limit?: number }

/**
 * The /compositions list (pages/compositions.md). Anon client (RLS compositions_public_read allows
 * active rows). Cached under compositions:list:{signature} for 900s and busted by apps/api with
 * compositions:*. Errors throw and are never cached; empty lists are not cached either.
 */
export async function listCompositions(
  params: CompositionListParams,
  { client = createSupabasePublicClient, now = () => new Date(), limit = COMPOSITION_PAGE_COUNT }: ListCompositionsDeps = {},
): Promise<CompositionListItem[]> {
  return getCached(keys.compositionsListBy(compositionListSignature(params)), ttl.compositionsList, async () => {
    let query = client().from('compositions').select(COMPOSITION_LIST_COLUMNS).eq('active', true)

    const cutoff = rangeCutoffISO(params.range, now())
    if (cutoff) query = query.gte('posted_at', cutoff)

    const term = params.search ? sanitizeCompositionSearch(params.search) : ''
    if (term) query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`)

    if (params.tags?.length) query = query.overlaps('tags', params.tags)

    const { data, error } = await query.order('posted_at', { ascending: params.sort === 'oldest' }).limit(limit)
    if (error) throw new Error(`compositions list query failed: ${error.message}`)
    return (data ?? []) as unknown as CompositionListItem[]
  })
}
