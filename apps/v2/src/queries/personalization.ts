import { queryOptions } from '@tanstack/react-query'
import { getRecommendationsFn } from '~/fns/personalization.fn'
import type { RecommendationSlot } from '~/lib/recommendation-slots'
import { ACCOUNT_KEY } from './account'

export const RECOMMENDATIONS_KEY = [...ACCOUNT_KEY, 'recommendations'] as const

export const personalizationQueries = {
  recommendations: (slot: RecommendationSlot) =>
    queryOptions({
      queryKey: [...RECOMMENDATIONS_KEY, slot],
      queryFn: () => getRecommendationsFn({ data: { slot } }),
      // A failed call just hides the slot.
      retry: false,
    }),
}
