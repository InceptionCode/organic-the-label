import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { createShopifyClient } from './client'
import { PRODUCTS_PAGE_QUERY, PRODUCT_BY_HANDLE_QUERY } from './queries'
import { parseProductsPage, parseProductDetail } from './parse'
import { getCached } from '~/lib/cache/redis'
import type { ProductsPageResponse, ProductDetailResponse } from './queries'

const STORE_PAGE_COUNT = 24

const SORT_KEYS = ['newest', 'price-low', 'price-high', 'name-asc', 'name-desc'] as const

const productSearchParamsSchema = z.object({
  after: z.string().nullish(),
  sort: z.enum(SORT_KEYS).nullish(),
  category: z.string().nullish(),
  tags: z.array(z.string()).nullish(),
  search: z.string().nullish(),
  exclusive: z.boolean().nullish(),
})

export type ProductSearchParams = z.infer<typeof productSearchParamsSchema>

function buildCacheKey(params: ProductSearchParams): string {
  const parts = [
    `after=${params.after ?? ''}`,
    `sort=${params.sort ?? 'newest'}`,
    `cat=${params.category ?? ''}`,
    `tags=${(params.tags ?? []).sort().join(',')}`,
    `q=${params.search ?? ''}`,
    `ex=${params.exclusive ? '1' : '0'}`,
  ]
  return `shopify:products:${parts.join(':')}`.toLowerCase()
}

function buildShopifyQuery(params: ProductSearchParams) {
  const parts: string[] = []

  if (params.category && params.category !== 'all') {
    parts.push(`product_type:{${params.category}}`)
  }
  if (params.tags?.length) {
    parts.push(`tag:${params.tags.join(' OR ')}`)
  }
  if (params.exclusive) {
    parts.push('tag:exclusive')
  }
  if (params.search) {
    parts.push(`title:*${params.search}*`)
  }

  return parts.length ? parts.join(' AND ') : null
}

function resolveSortKey(sort: ProductSearchParams['sort']): { sortKey: string; sortOrder: boolean } {
  switch (sort) {
    case 'price-low':
      return { sortKey: 'PRICE', sortOrder: false }
    case 'price-high':
      return { sortKey: 'PRICE', sortOrder: true }
    case 'name-asc':
      return { sortKey: 'TITLE', sortOrder: false }
    case 'name-desc':
      return { sortKey: 'TITLE', sortOrder: true }
    default:
      return { sortKey: 'CREATED_AT', sortOrder: true }
  }
}

// Replaces: lib/Shopify/products-cache.ts + app/api/store/get-products.ts
export const getProductsFn = createServerFn({ method: 'GET' })
  .validator(productSearchParamsSchema)
  .handler(async ({ data: params }) => {
    const cacheKey = buildCacheKey(params)
    const query = buildShopifyQuery(params)
    const { sortKey, sortOrder } = resolveSortKey(params.sort)

    return getCached(
      cacheKey,
      async () => {
        const client = createShopifyClient()
        const { data, errors } = await client.request<ProductsPageResponse>(PRODUCTS_PAGE_QUERY, {
          variables: {
            first: STORE_PAGE_COUNT,
            after: params.after ?? null,
            sortKey,
            sortOrder,
            query,
          },
        })

        if (errors || !data) {
          throw new Error(`Shopify products fetch failed: ${errors?.message ?? 'no data'}`)
        }

        return {
          products: parseProductsPage(data.products.edges),
          pageInfo: data.products.pageInfo,
          error: null as null,
        }
      },
      900,
    )
  })

// Replaces: lib/Shopify/products-details-cache.ts + app/api/store/get-product-details.ts
export const getProductByHandleFn = createServerFn({ method: 'GET' })
  .validator(z.object({ handle: z.string() }))
  .handler(async ({ data: { handle } }) => {
    return getCached(
      `product:handle:${handle}`,
      async () => {
        const client = createShopifyClient()
        const { data, errors } = await client.request<ProductDetailResponse>(PRODUCT_BY_HANDLE_QUERY, {
          variables: { handle },
        })

        if (errors || !data?.product) {
          throw new Error(`Shopify product fetch failed for "${handle}": ${errors?.message ?? 'no data'}`)
        }

        return { product: parseProductDetail(data.product), error: null as null }
      },
      60 * 60 * 24, // 24 h — product detail changes infrequently; busted by Hono webhook
    )
  })
