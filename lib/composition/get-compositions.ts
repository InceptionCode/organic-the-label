import { createSupabasePublicClient } from '@/utils/supabase/base';
import type { CompositionListItem } from '@/lib/schemas';
import {
  rangeToCutoffISO,
  type NormalizedCompositionSearchParams,
} from './normalize-search-params';

const TAG = '[getCompositions]';

const LIST_COLUMNS =
  'id, slug, title, description, bpm, musical_key, tags, platform, embed_url, posted_at';

export type GetCompositionsResult = {
  compositions: CompositionListItem[];
  error: string | null;
};

export async function getCompositions(
  params: NormalizedCompositionSearchParams,
  limit: number,
): Promise<GetCompositionsResult> {
  console.info(`${TAG} start`, { ...params, limit });

  try {
    const supabase = createSupabasePublicClient();
    console.info(`${TAG} supabase client ready — building query`);

    let query = supabase
      .from('compositions')
      .select(LIST_COLUMNS)
      .eq('active', true);

    const cutoff = rangeToCutoffISO(params.range);
    if (cutoff) {
      console.info(`${TAG} applying date cutoff`, { range: params.range, cutoff });
      query = query.gte('posted_at', cutoff);
    }

    if (params.search) {
      const term = params.search.replace(/[%,()]/g, ' ').trim();
      if (term) {
        console.info(`${TAG} applying search term`, { term });
        query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
      }
    }

    if (params.tags?.length) {
      console.info(`${TAG} applying tag filter`, { tags: params.tags });
      query = query.overlaps('tags', params.tags);
    }

    query = query
      .order('posted_at', { ascending: params.sort === 'oldest' })
      .limit(limit);

    console.info(`${TAG} executing query`, { sort: params.sort });
    const { data, error } = await query;

    if (error) {
      console.error(`${TAG} supabase error`, error.message);
      return { compositions: [], error: error.message };
    }

    const compositions = (data ?? []) as unknown as CompositionListItem[];
    console.info(`${TAG} done`, { count: compositions.length });
    return { compositions, error: null };
  } catch (err) {
    console.error(`${TAG} unexpected failure`, err);
    return { compositions: [], error: 'Failed to load compositions' };
  }
}
