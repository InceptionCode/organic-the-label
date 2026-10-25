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

export const PRODUCT_PAGE_SIZE = 24

export type ProductSort = 'newest' | 'price-low' | 'price-high' | 'name-asc' | 'name-desc'

export type ListProductsParams = {
  sort?: ProductSort
  category?: string | null
  tags?: string[]
  exclusive?: boolean
  after?: string | null
}

const SORTS: Record<ProductSort, { sortKey: ProductSortKey; reverse: boolean }> = {
  newest: { sortKey: 'CREATED_AT', reverse: true },
  'price-low': { sortKey: 'PRICE', reverse: false },
  'price-high': { sortKey: 'PRICE', reverse: true },
  'name-asc': { sortKey: 'TITLE', reverse: false },
  'name-desc': { sortKey: 'TITLE', reverse: true },
}

function normalizeListParams(params: ListProductsParams) {
  const category = params.category?.trim().toLowerCase()
  return {
    sort: params.sort ?? 'newest',
    category: category && category !== 'all' ? category : null,
    tags: [...new Set((params.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean))].sort(),
    exclusive: params.exclusive === true,
    after: params.after ?? null,
  }
}

function buildSearchQuery(p: ReturnType<typeof normalizeListParams>): string | null {
  const parts: string[] = []
  if (p.category) parts.push(`product_type:${JSON.stringify(p.category)}`)
  if (p.tags.length > 0) parts.push(`(${p.tags.map((t) => `tag:${JSON.stringify(t)}`).join(' OR ')})`)
  if (p.exclusive) parts.push('tag:exclusive')
  return parts.length > 0 ? parts.join(' AND ') : null
}

export async function getProduct(handle: string): Promise<Product | null> {
  return getCached(keys.productByHandle(handle), ttl.product, async () => {
    const data = await shopifyQuery<ProductByHandleData, ProductByHandleVars>(PRODUCT_BY_HANDLE_QUERY, { handle })
    return data.product ? parseProduct(data.product) : null
  })
}

export async function listProducts(params: ListProductsParams = {}): Promise<ProductPage> {
  const p = normalizeListParams(params)
  const sig = [
    `sort=${p.sort}`,
    `category=${p.category ?? ''}`,
    `tags=${p.tags.join(',')}`,
    `exclusive=${p.exclusive}`,
    `after=${p.after ?? ''}`,
  ].join('|')

  return getCached(
    keys.productList(sig),
    ttl.productList,
    async () => {
      const data = await shopifyQuery<ProductsListData, ProductsListVars>(PRODUCTS_LIST_QUERY, {
        first: PRODUCT_PAGE_SIZE,
        after: p.after,
        query: buildSearchQuery(p),
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

export async function searchProducts(q: string, first = 10): Promise<ProductSummary[]> {
  const term = q.trim()
  if (!term) return []
  return getCached(keys.productSearch(term), ttl.productSearch, async () => {
    const data = await shopifyQuery<ProductsListData, ProductsListVars>(PRODUCTS_LIST_QUERY, {
      first,
      query: term,
      sortKey: 'RELEVANCE',
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
