import { createHash } from 'node:crypto'
import { getCached } from '~/server/cache/redis'
import { keys, ttl } from '~/server/cache/keys'
import { shopifyQuery } from '~/server/shopify/client'
import { parseProductSummary } from '~/server/shopify/parse'
import { PRODUCT_SUMMARY_FIELDS, type RawProductSummary } from '~/server/shopify/queries'
import type { ProductSummary } from '~/server/shopify/types'

/** Storefront `nodes` accepts at most 250 ids per call. */
const NODES_LIMIT = 250

const PRODUCTS_BY_IDS_QUERY = `
  query ProductsByIds($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product { ${PRODUCT_SUMMARY_FIELDS} }
    }
  }
`

type ProductsByIdsVars = { ids: string[] }
// Unknown, deleted, or unpublished ids come back as null; non-product ids as an empty object.
type ProductsByIdsData = { nodes: (Partial<RawProductSummary> | null)[] }

function isProduct(node: Partial<RawProductSummary> | null): node is RawProductSummary {
  return !!node?.id && typeof node.handle === 'string'
}

export function idsHash(ids: readonly string[]): string {
  return createHash('sha1').update(ids.join(',')).digest('hex').slice(0, 16)
}

/**
 * Product summaries for Shopify product GIDs, in the order given. Ids Shopify no longer returns are
 * dropped, so a deleted product never renders broken.
 */
export async function getProductsByIds(gids: readonly string[]): Promise<ProductSummary[]> {
  const unique = [...new Set(gids.filter(Boolean))]
  if (unique.length === 0) return []
  const sorted = [...unique].sort()

  const byId = await getCached(keys.productsByIds(idsHash(sorted)), ttl.productsByIds, async () => {
    const found: Record<string, ProductSummary> = {}
    for (let i = 0; i < sorted.length; i += NODES_LIMIT) {
      const data = await shopifyQuery<ProductsByIdsData, ProductsByIdsVars>(PRODUCTS_BY_IDS_QUERY, {
        ids: sorted.slice(i, i + NODES_LIMIT),
      })
      for (const node of data.nodes) if (isProduct(node)) found[node.id] = parseProductSummary(node)
    }
    return found
  })

  return unique.flatMap((id) => (byId[id] ? [byId[id]] : []))
}
