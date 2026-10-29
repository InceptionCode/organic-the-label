import type { ProductSummary } from '~/server/shopify/types'
import type { CompositionListItem } from '~/server/compositions/columns'

export type SearchResults = {
  q: string
  products: ProductSummary[]
  compositions: CompositionListItem[]
  /** True when one source failed and only the other is shown. */
  partial: boolean
}

export type SearchSources = {
  products: (q: string) => Promise<ProductSummary[]>
  compositions: (q: string) => Promise<CompositionListItem[]>
}

/**
 * Site search across products and compositions (pages/search.md). Both sources run together; if
 * one fails the other is returned with `partial: true`. If both fail, it throws. Each source
 * caches only its own successful results, so a failed half is never cached.
 */
export async function search(q: string, sources: SearchSources, logger: Pick<Console, 'error'> = console): Promise<SearchResults> {
  const [products, compositions] = await Promise.allSettled([sources.products(q), sources.compositions(q)])
  const reason = (r: PromiseRejectedResult) => (r.reason instanceof Error ? r.reason.message : String(r.reason))
  if (products.status === 'rejected') logger.error('[search] products failed:', reason(products))
  if (compositions.status === 'rejected') logger.error('[search] compositions failed:', reason(compositions))
  if (products.status === 'rejected' && compositions.status === 'rejected') {
    throw new Error('Search sources are unavailable')
  }
  return {
    q,
    products: products.status === 'fulfilled' ? products.value : [],
    compositions: compositions.status === 'fulfilled' ? compositions.value : [],
    partial: products.status === 'rejected' || compositions.status === 'rejected',
  }
}
