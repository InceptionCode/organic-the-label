import { queryOptions } from '@tanstack/react-query'
import { getFeaturedFreeResourceFn, getFreeResourceFn } from '~/fns/free-resources.fn'

export const freeResourceQueries = {
  featured: () => queryOptions({ queryKey: ['free-resources', 'featured'], queryFn: () => getFeaturedFreeResourceFn() }),
  bySlug: (slug: string) =>
    queryOptions({ queryKey: ['free-resources', 'slug', slug], queryFn: () => getFreeResourceFn({ data: { slug } }) }),
}
