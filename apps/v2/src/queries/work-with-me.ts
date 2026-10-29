import { queryOptions } from '@tanstack/react-query'
import { getRecentPostsFn, getWorkWithMeSpotifyFn } from '~/fns/work-with-me.fn'

const TEN_MINUTES = 10 * 60 * 1000

export const workWithMeQueries = {
  spotify: () =>
    queryOptions({
      queryKey: ['work-with-me', 'spotify'],
      queryFn: () => getWorkWithMeSpotifyFn(),
      staleTime: TEN_MINUTES,
    }),
  recentPosts: () =>
    queryOptions({
      queryKey: ['work-with-me', 'recent-posts'],
      queryFn: () => getRecentPostsFn(),
      staleTime: TEN_MINUTES,
    }),
}
