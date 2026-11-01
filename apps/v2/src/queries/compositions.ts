import { queryOptions } from '@tanstack/react-query'
import { getCompositionsFn } from '~/fns/compositions.fn'
import type { CompositionListParams } from '~/lib/composition-search'

export const compositionQueries = {
  /** Params come from toCompositionListParams, so equal filters share one key. */
  list: (params: CompositionListParams) =>
    queryOptions({
      queryKey: ['compositions', 'list', params],
      queryFn: () => getCompositionsFn({ data: params }),
    }),
}
