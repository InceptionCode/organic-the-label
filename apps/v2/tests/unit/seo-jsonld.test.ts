import { describe, expect, test } from 'bun:test'
import {
  breadcrumbJsonLd,
  compositionJsonLd,
  organizationJsonLd,
  productJsonLd,
  websiteJsonLd,
  type ProductJsonLdInput,
} from '~/seo/jsonld'

const ld = (entry: { 'script:ld+json': unknown }) => entry['script:ld+json']

const product: ProductJsonLdInput = {
  handle: 'night-drive',
  title: 'Night Drive',
  description: 'A dark drum kit.',
  category: 'drum kit',
  image: { url: 'https://cdn.shopify.com/a.png', altText: null, width: 1000, height: 1000 },
  images: [
    { url: 'https://cdn.shopify.com/a.png', altText: null, width: 1000, height: 1000 },
    { url: 'https://cdn.shopify.com/b.png', altText: null, width: 1000, height: 1000 },
  ],
  variantId: 'gid://shopify/ProductVariant/4242',
  price: { amount: '29.99', currencyCode: 'USD' },
  availableForSale: true,
}

describe('JSON-LD builders', () => {
  test('organizationJsonLd', () => {
    expect(ld(organizationJsonLd())).toMatchSnapshot()
  })

  test('websiteJsonLd has a SearchAction', () => {
    const site = ld(websiteJsonLd()) as Record<string, any>
    expect(site.potentialAction.target.urlTemplate).toBe('https://organicsonics.com/search?q={search_term_string}')
    expect(site).toMatchSnapshot()
  })

  test('productJsonLd: InStock offer, deduped images, sku from the variant gid', () => {
    const p = ld(productJsonLd(product)) as Record<string, any>
    expect(p.image).toEqual(['https://cdn.shopify.com/a.png', 'https://cdn.shopify.com/b.png'])
    expect(p.sku).toBe('4242')
    expect(p.offers.availability).toBe('https://schema.org/InStock')
    expect(p).toMatchSnapshot()
  })

  test('productJsonLd: OutOfStock, and no offers without a price', () => {
    expect((ld(productJsonLd({ ...product, availableForSale: false })) as any).offers.availability).toBe(
      'https://schema.org/OutOfStock',
    )
    const noPrice = ld(productJsonLd({ ...product, price: null, image: null, images: [] })) as Record<string, any>
    expect(noPrice.offers).toBeUndefined()
    expect(noPrice.image).toBeUndefined()
    expect(JSON.stringify(noPrice)).not.toContain('undefined')
  })

  test('breadcrumbJsonLd', () => {
    expect(
      ld(breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Store', path: '/store' },
        { name: 'Night Drive', path: '/store/night-drive' },
      ])),
    ).toMatchSnapshot()
  })

  test('compositionJsonLd: MusicComposition with audio', () => {
    expect(
      ld(compositionJsonLd({
        slug: 'late-night',
        title: 'Late Night',
        description: 'A loop.',
        postedAt: '2026-08-14T18:30:00.000Z',
        tags: ['trap'],
        musicalKey: 'C minor',
        previewUrl: 'https://cdn.shopify.com/late-night.mp3',
      })),
    ).toMatchSnapshot()
  })

  test('compositionJsonLd: falls back to CreativeWork without musical detail', () => {
    const c = ld(compositionJsonLd({ slug: 'x', title: 'X' })) as Record<string, any>
    expect(c['@type']).toBe('CreativeWork')
    expect(c.creator).toEqual({ '@type': 'Organization', name: 'Organic Sonics', url: 'https://organicsonics.com' })
    expect(c.composer).toBeUndefined()
    expect(c.url).toBe('https://organicsonics.com/compositions#x')
  })
})
