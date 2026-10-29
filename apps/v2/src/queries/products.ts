import { queryOptions } from '@tanstack/react-query'
import { getNewestProductsFn, getProductFn, listProductsFn } from '~/fns/catalog.fn'
import { compactListParams, type ListProductsParams } from '~/lib/product-list-params'

export const productQueries = {
  byHandle: (handle: string) =>
    queryOptions({
      queryKey: ['products', 'byHandle', handle],
      queryFn: () => getProductFn({ data: { handle } }),
    }),
  newest: (n = 5) =>
    queryOptions({ queryKey: ['products', 'newest', n], queryFn: () => getNewestProductsFn({ data: { n } }) }),
  /** Params are compacted, so `{}` and `{ sort: 'newest' }` share one key (store and home). */
  list: (params: ListProductsParams = {}) => {
    const p = compactListParams(params)
    return queryOptions({
      queryKey: ['products', 'list', p],
      queryFn: () => listProductsFn({ data: p }),
      staleTime: 60_000,
    })
  },
}
