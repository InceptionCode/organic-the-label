import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { searchProducts } from '~/server/catalog/search-products'
import { searchCompositions } from '~/server/compositions/search-compositions'
import { search } from '~/server/search/search'
import { SEARCH_Q_MAX } from '~/lib/search-query'
import { toSafeError } from './errors'

export const searchFn = createServerFn({ method: 'GET' })
  .validator(z.object({ q: z.string().trim().min(1).max(SEARCH_Q_MAX) }))
  .handler(async ({ data }) => {
    try {
      return await search(data.q, {
        products: (q) => searchProducts(q, { first: 24 }),
        compositions: (q) => searchCompositions(q, { limit: 12 }),
      })
    } catch (error) {
      throw toSafeError('search', 'Search is unavailable right now.', error)
    }
  })
