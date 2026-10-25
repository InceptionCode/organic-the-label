import { queryOptions } from '@tanstack/react-query'
import { getNewestProductsFn, getProductFn, listProductsFn, searchProductsFn } from '~/fns/catalog.fn'
import type { ListProductsParams } from '~/server/catalog/products'

export const productQueries = {
  byHandle: (handle: string) =>
    queryOptions({ queryKey: ['product', handle], queryFn: () => getProductFn({ data: { handle } }) }),
  newest: (n = 5) =>
    queryOptions({ queryKey: ['products', 'newest', n], queryFn: () => getNewestProductsFn({ data: { n } }) }),
  list: (params: ListProductsParams = {}) =>
    queryOptions({ queryKey: ['products', 'list', params], queryFn: () => listProductsFn({ data: params }) }),
  search: (q: string) =>
    queryOptions({
      queryKey: ['products', 'search', q.trim().toLowerCase()],
      queryFn: () => searchProductsFn({ data: { q } }),
      enabled: q.trim().length > 0,
      staleTime: 5 * 60_000,
    }),
}
