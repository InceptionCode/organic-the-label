import { describe, expect, test } from 'bun:test'
import { buildSrcSet, SHOPIFY_WIDTHS, shopifyImageUrl } from '~/ui/shopify-image'

const SRC = 'https://cdn.shopify.com/s/files/1/0001/products/kit.png'

describe('ShopifyImage srcset', () => {
  test('has one candidate per width (9)', () => {
    const candidates = buildSrcSet(SRC).split(', ')
    expect(candidates).toHaveLength(9)
    expect(candidates.map((c) => Number(c.split(' ')[1].replace('w', '')))).toEqual([...SHOPIFY_WIDTHS])
    expect(candidates[0]).toBe(`${SRC}?width=320 320w`)
  })

  test('appends with & when the URL already has a query', () => {
    expect(shopifyImageUrl(`${SRC}?v=1712345`, 480)).toBe(`${SRC}?v=1712345&width=480`)
  })

  test('replaces an existing width parameter', () => {
    expect(shopifyImageUrl(`${SRC}?width=2048&v=2`, 640)).toBe(`${SRC}?width=640&v=2`)
  })
})
