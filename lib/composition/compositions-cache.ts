import { unstable_cache } from 'next/cache';
import { COMPOSITION_PAGE_COUNT } from '@/lib/schemas';
import { getCompositions } from './get-compositions';
import type { NormalizedCompositionSearchParams } from './normalize-search-params';

const buildKey = (params: NormalizedCompositionSearchParams) => [
  'compositions:list:v1',
  `range=${params.range}`,
  `sort=${params.sort}`,
  `tags=${params.tags?.join(',') ?? ''}`,
  `search=${params.search ?? ''}`,
];

export const getCachedCompositions = (params: NormalizedCompositionSearchParams) =>
  unstable_cache(
    async () => getCompositions(params, COMPOSITION_PAGE_COUNT),
    buildKey(params),
    { revalidate: 900, tags: ['compositions'] },
  )();