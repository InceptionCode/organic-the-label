import { queryOptions } from '@tanstack/react-query'
import { getRecentCompositionsFn, listFreeResourcesFn } from '~/fns/explore.fn'

export const exploreQueries = {
  recentCompositions: (limit = 4) =>
    queryOptions({
      queryKey: ['compositions', 'recent', limit],
      queryFn: () => getRecentCompositionsFn({ data: { limit } }),
    }),
  freeResources: () =>
    queryOptions({
      queryKey: ['free-resources', 'list'],
      queryFn: () => listFreeResourcesFn(),
    }),
}
