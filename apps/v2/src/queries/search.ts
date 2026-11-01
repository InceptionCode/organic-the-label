import { queryOptions } from '@tanstack/react-query'
import { searchFn } from '~/fns/search.fn'
import { normalizeSearchQuery } from '~/lib/search-query'

export const searchQueries = {
  /** Keyed by the normalized query, so "808 " and "808" share one entry. Default staleTime (60s). */
  results: (q: string) =>
    queryOptions({
      queryKey: ['search', normalizeSearchQuery(q)],
      queryFn: () => searchFn({ data: { q } }),
    }),
}
