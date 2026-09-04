import { describe, it, expect } from 'vitest'
import { parseStoreData } from '@/lib/store/parse-store-data'
import type { ProductsPageResponse } from '@/lib/Shopify/queries'

// parseStoreData maps raw Shopify GraphQL product edges to the internal Product type.
// It is the single transformation point between Shopify and the rest of the app.
// Bugs here silently corrupt every product shown in the store.

type ShopifyEdge = ProductsPageResponse['products']['edges'][number]

function makeEdge(overrides: Partial<ShopifyEdge['node']> = {}): ShopifyEdge {
  return {
    cursor: 'cursor-1',
    node: {
      id: 'gid://shopify/Product/1',
      handle: 'sample-drum-kit',
      title: 'Sample Drum Kit',
      createdAt: '2024-01-01T00:00:00.000Z' as unknown as Date,
      availableForSale: true,
      productType: 'kit',
      tags: ['trap', 'hiphop'],
      featuredImage: {
        url: 'https://cdn.shopify.com/image.jpg',
        altText: 'Sample Drum Kit',
        width: 600,
        height: 800,
      },
      variants: {
        edges: [
          {
            node: {
              id: 'gid://shopify/ProductVariant/1',
              title: 'Default Title',
              availableForSale: true,
              price: { amount: '29.99', currencyCode: 'USD' },
            },
          },
        ],
      },
      metafield: null,
      ...overrides,
    },
  }
}

describe('parseStoreData', () => {
  // Empty array input must return empty array — no iteration errors.
  it('returns an empty array for empty input', () => {
    expect(parseStoreData([])).toEqual([])
  })

  // The happy path — a valid Shopify product maps to a Product.
  it('maps a valid product edge to a Product object', () => {
    const result = parseStoreData([makeEdge()])
    expect(result).toHaveLength(1)
    const product = result[0]
    expect(product.id).toBe('gid://shopify/Product/1')
    expect(product.name).toBe('Sample Drum Kit')
    expect(product.handle).toBe('sample-drum-kit')
    expect(product.price).toBe(29.99)
    expect(product.category).toBe('kit')
  })

  // Price must be parsed as a float — Shopify sends it as a string.
  it('parses the price string as a float', () => {
    const result = parseStoreData([makeEdge()])
    expect(result[0].price).toBe(29.99)
    expect(typeof result[0].price).toBe('number')
  })

  // variantId is read from the first variant — required for add-to-cart.
  it('maps the first variant id as variantId', () => {
    const result = parseStoreData([makeEdge()])
    expect(result[0].variantId).toBe('gid://shopify/ProductVariant/1')
  })

  // tags must be normalized to lowercase.
  it('normalizes tags to lowercase', () => {
    const result = parseStoreData([makeEdge({ tags: ['Trap', 'HipHop'] })])
    expect(result[0].tags).toEqual(['trap', 'hiphop'])
  })

  // Multiple products must all be mapped.
  it('maps multiple product edges', () => {
    const edge2 = makeEdge({
      id: 'gid://shopify/Product/2',
      handle: 'beat-pack',
      title: 'Beat Pack',
      productType: 'beat',
    })
    const result = parseStoreData([makeEdge(), edge2])
    expect(result).toHaveLength(2)
    expect(result[1].handle).toBe('beat-pack')
  })

  // An invalid productType (not in the schema enum) should throw.
  // This prevents silently serving products with broken category values.
  it('throws for a product with an invalid productType', () => {
    const badEdge = makeEdge({ productType: 'invalid-type' })
    expect(() => parseStoreData([badEdge])).toThrow()
  })

  // null featuredImage must be handled gracefully — many products have no image.
  it('handles a null featuredImage without throwing', () => {
    const result = parseStoreData([makeEdge({ featuredImage: null })])
    expect(result[0].image).toBeNull()
  })
})
