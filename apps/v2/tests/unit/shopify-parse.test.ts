import { describe, expect, test } from 'bun:test'
import { parseCart, parseProduct, parseProductPage, parseProductSummary } from '~/server/shopify/parse'
import type { RawCart, RawProduct, RawProductSummary } from '~/server/shopify/queries'

const image = { url: 'https://cdn.shopify.com/a.png', altText: null, width: 800, height: 800 }

const summary: RawProductSummary = {
  id: 'gid://shopify/Product/1',
  handle: 'night-drive',
  title: 'Night Drive',
  createdAt: '2026-01-01T00:00:00Z',
  availableForSale: true,
  productType: 'Beats',
  tags: ['HipHop', 'Exclusive'],
  featuredImage: image,
  variants: { edges: [{ node: { id: 'gid://shopify/ProductVariant/9', availableForSale: true, price: { amount: '29.99', currencyCode: 'USD' } } }] },
  audioPreviewMetafield: { value: JSON.stringify([{ preview_title: 'Main', preview_url: 'https://cdn.shopify.com/a.mp3' }]) },
}

describe('parse', () => {
  test('flattens a product summary', () => {
    const p = parseProductSummary(summary)
    expect(p.category).toBe('beats')
    expect(p.tags).toEqual(['hiphop', 'exclusive'])
    expect(p.isExclusive).toBe(true)
    expect(p.variantId).toBe('gid://shopify/ProductVariant/9')
    expect(p.price).toEqual({ amount: '29.99', currencyCode: 'USD' })
    expect(p.image?.url).toBe(image.url)
    expect(p.audioPreview?.preview_title).toBe('Main')
  })

  test('tolerates missing variants, image and bad metafield JSON', () => {
    const p = parseProductSummary({ ...summary, featuredImage: null, variants: { edges: [] }, audioPreviewMetafield: { value: '{oops' } })
    expect(p.image).toBeNull()
    expect(p.variantId).toBeNull()
    expect(p.price).toBeNull()
    expect(p.audioPreview).toBeNull()
  })

  test('parses a full product and falls back to the first image', () => {
    const raw: RawProduct = {
      ...summary,
      featuredImage: null,
      description: 'desc',
      descriptionHtml: '<p>desc</p>',
      images: { edges: [{ node: image }, { node: { ...image, url: 'https://cdn.shopify.com/b.png' } }] },
      licenseVariants: {
        edges: [
          { node: { id: 'v1', title: 'Default Title', availableForSale: true, price: { amount: '29.99', currencyCode: 'USD' } } },
          { node: { id: 'v2', title: 'WAV Lease', availableForSale: false, price: { amount: '49.99', currencyCode: 'USD' } } },
        ],
      },
      whatsIncludedMetafield: { value: JSON.stringify([{ label: 'WAV' }]) },
    }
    const p = parseProduct(raw)
    expect(p.images).toHaveLength(2)
    expect(p.image?.url).toBe(image.url)
    expect(p.whatsIncluded).toEqual([{ label: 'WAV' }])
    expect(p.audioPreviews).toHaveLength(1)
    expect(p.licenseOptions).toEqual([
      { id: 'v1', title: 'Night Drive', price: { amount: '29.99', currencyCode: 'USD' }, availableForSale: true },
      { id: 'v2', title: 'WAV Lease', price: { amount: '49.99', currencyCode: 'USD' }, availableForSale: false },
    ])
  })

  test('parses a product page', () => {
    const page = parseProductPage({ products: { pageInfo: { hasNextPage: true, endCursor: 'c1' }, edges: [{ node: summary }] } })
    expect(page.products).toHaveLength(1)
    expect(page.pageInfo).toEqual({ hasNextPage: true, endCursor: 'c1' })
  })

  test('parses a cart and flattens lines', () => {
    const money = { amount: '29.99', currencyCode: 'USD' }
    const raw: RawCart = {
      id: 'gid://shopify/Cart/1',
      checkoutUrl: 'https://shop.example.com/cart/c/1',
      totalQuantity: 1,
      cost: { subtotalAmount: money, totalAmount: money },
      lines: {
        edges: [
          {
            node: {
              id: 'line-1',
              quantity: 1,
              merchandise: { id: 'v-1', title: 'Default', product: { handle: 'night-drive', title: 'Night Drive' }, image, price: money },
            },
          },
        ],
      },
    }
    const cart = parseCart(raw)
    expect(cart?.lines[0]?.merchandise.product.handle).toBe('night-drive')
    expect(cart?.cost.totalAmount).toEqual(money)
    expect(parseCart(null)).toBeNull()
  })
})
