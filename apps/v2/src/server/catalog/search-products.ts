import { getCached } from '~/server/cache/redis'
import { keys, ttl } from '~/server/cache/keys'
import { shopifyQuery } from '~/server/shopify/client'
import { parseProductPage } from '~/server/shopify/parse'
import { PRODUCTS_LIST_QUERY, type ProductsListData, type ProductsListVars } from '~/server/shopify/queries'
import type { ProductSummary } from '~/server/shopify/types'
import { normalizeSearchQuery } from '~/lib/search-query'

/** Shopify search syntax characters dropped from user input, so q is plain full-text search. */
const SYNTAX = /[():"\\*]/g

/**
 * Storefront full-text product search for /search (pages/search.md). Same fragment and parser as
 * the store, so results fit the shared card. Cached under shopify:products:search:{normalized q}
 * (busted by apps/api on product webhooks); empty results and errors are not cached.
 */
export async function searchProducts(q: string, { first = 24 }: { first?: number } = {}): Promise<ProductSummary[]> {
  const term = normalizeSearchQuery(q).replace(SYNTAX, ' ').replace(/\s+/g, ' ').trim()
  if (!term) return []
  return getCached(keys.productSearch(`${term}|${first}`), ttl.productSearch, async () => {
    const data = await shopifyQuery<ProductsListData, ProductsListVars>(PRODUCTS_LIST_QUERY, {
      first,
      query: term,
      sortKey: 'RELEVANCE',
    })
    return parseProductPage(data).products
  })
}
