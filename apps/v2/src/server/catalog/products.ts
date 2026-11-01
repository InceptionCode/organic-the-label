import { getCached } from '~/server/cache/redis'
import { keys, ttl } from '~/server/cache/keys'
import { shopifyQuery } from '~/server/shopify/client'
import { parseProduct, parseProductPage } from '~/server/shopify/parse'
import {
  PRODUCT_BY_HANDLE_QUERY,
  PRODUCT_HANDLES_QUERY,
  PRODUCTS_LIST_QUERY,
  type ProductByHandleData,
  type ProductByHandleVars,
  type ProductHandlesData,
  type ProductHandlesVars,
  type ProductSortKey,
  type ProductsListData,
  type ProductsListVars,
} from '~/server/shopify/queries'
import type { Product, ProductPage, ProductSitemapEntry, ProductSummary } from '~/server/shopify/types'
import {
  buildShopifyProductQuery,
  normalizeListParams,
  stableListKey,
  type ListProductsParams,
  type StoreSort,
} from '~/lib/product-list-params'
import { sanitizeDescriptionHtml } from './sanitize-html'

export type { ListProductsParams }

/** v1 STORE_PAGE_COUNT. */
export const PRODUCT_PAGE_SIZE = 24

export type ProductSort = StoreSort

const SORTS: Record<ProductSort, { sortKey: ProductSortKey; reverse: boolean }> = {
  newest: { sortKey: 'CREATED_AT', reverse: true },
  'price-low': { sortKey: 'PRICE', reverse: false },
  'price-high': { sortKey: 'PRICE', reverse: true },
  'name-asc': { sortKey: 'TITLE', reverse: false },
  'name-desc': { sortKey: 'TITLE', reverse: true },
}

export async function getProduct(handle: string): Promise<Product | null> {
  return getCached(keys.productByHandle(handle), ttl.product, async () => {
    const data = await shopifyQuery<ProductByHandleData, ProductByHandleVars>(PRODUCT_BY_HANDLE_QUERY, { handle })
    if (!data.product) return null
    const product = parseProduct(data.product)
    return { ...product, descriptionHtml: sanitizeDescriptionHtml(product.descriptionHtml) }
  })
}

export async function listProducts(params: ListProductsParams = {}): Promise<ProductPage> {
  const p = normalizeListParams(params)

  return getCached(
    keys.productList(stableListKey(p)),
    ttl.productList,
    async () => {
      const data = await shopifyQuery<ProductsListData, ProductsListVars>(PRODUCTS_LIST_QUERY, {
        first: PRODUCT_PAGE_SIZE,
        after: p.after,
        query: buildShopifyProductQuery(p),
        ...SORTS[p.sort],
      })
      return parseProductPage(data)
    },
    { shouldCache: (page) => page.products.length > 0 },
  )
}

export async function getNewestProducts(n: number): Promise<ProductSummary[]> {
  return getCached(keys.productsNewest(n), ttl.productsNewest, async () => {
    const data = await shopifyQuery<ProductsListData, ProductsListVars>(PRODUCTS_LIST_QUERY, {
      first: n,
      sortKey: 'CREATED_AT',
      reverse: true,
    })
    return parseProductPage(data).products
  })
}

export async function getProductHandles(): Promise<ProductSitemapEntry[]> {
  return getCached(keys.productsSitemap(), ttl.productsSitemap, async () => {
    const entries: ProductSitemapEntry[] = []
    let after: string | null = null
    do {
      const data: ProductHandlesData = await shopifyQuery<ProductHandlesData, ProductHandlesVars>(
        PRODUCT_HANDLES_QUERY,
        { first: 250, after },
      )
      for (const { node } of data.products.edges) entries.push({ handle: node.handle, updatedAt: node.updatedAt })
      after = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null
    } while (after)
    return entries
  })
}
