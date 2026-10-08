import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getCached } from '~/lib/cache/redis'
import { createSupabaseServerClient } from '~/lib/supabase/server'

const COMPOSITION_PAGE_COUNT = 24

const compositionRangeSchema = z.enum(['7d', '30d', '90d', 'year', 'all'])
const compositionSortSchema = z.enum(['newest', 'oldest'])

export const compositionSearchParamsSchema = z.object({
  search: z.string().nullish(),
  tags: z.array(z.string()).nullish(),
  range: compositionRangeSchema.default('all'),
  sort: compositionSortSchema.default('newest'),
})

export type CompositionSearchParams = z.infer<typeof compositionSearchParamsSchema>

function rangeToCutoffISO(range: CompositionSearchParams['range']): string | null {
  if (range === 'all') return null
  if (range === 'year') {
    const now = new Date()
    return new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString()
  }
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const cutoff = new Date()
  cutoff.setUTCDate(cutoff.getUTCDate() - days)
  return cutoff.toISOString()
}

function buildCacheKey(params: CompositionSearchParams): string {
  return [
    'compositions',
    `range=${params.range}`,
    `sort=${params.sort}`,
    `tags=${(params.tags ?? []).sort().join(',')}`,
    `q=${params.search ?? ''}`,
  ]
    .join(':')
    .toLowerCase()
}

const LIST_COLUMNS =
  'id,slug,title,description,bpm,musical_key,tags,platform,embed_url,posted_at,preview_url,audio_file_url'

// Minimal shape returned by the SELECT above — enough for the compositions listing.
export interface CompositionListItem {
  id: string
  slug: string
  title: string
  description: string | null
  bpm: number | null
  musical_key: string | null
  tags: string[] | null
  platform: string | null
  embed_url: string | null
  posted_at: string | null
  preview_url: string | null
  audio_file_url: string | null
}

// Replaces: lib/composition/compositions-cache.ts + lib/composition/get-compositions.ts
export const getCompositionsFn = createServerFn({ method: 'GET' })
  .validator(compositionSearchParamsSchema)
  .handler(async ({ data: params }) => {
    const cacheKey = buildCacheKey(params)

    return getCached(
      cacheKey,
      async () => {
        const supabase = createSupabaseServerClient()
        let query = supabase
          .from('compositions')
          .select(LIST_COLUMNS)
          .eq('active', true)

        const cutoff = rangeToCutoffISO(params.range)
        if (cutoff) query = query.gte('posted_at', cutoff)

        if (params.search) {
          const term = params.search.replace(/[%,()]/g, ' ').trim()
          if (term) query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`)
        }

        if (params.tags?.length) {
          query = query.overlaps('tags', params.tags)
        }

        query = query
          .order('posted_at', { ascending: params.sort === 'oldest' })
          .limit(COMPOSITION_PAGE_COUNT)

        const { data, error } = await query

        if (error) throw new Error(`Compositions fetch failed: ${error.message}`)

        return {
          compositions: (data ?? []) as CompositionListItem[],
          error: null as null,
        }
      },
      900,
    )
  })
