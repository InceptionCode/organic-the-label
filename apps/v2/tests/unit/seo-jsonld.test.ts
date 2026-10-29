import { describe, expect, test } from 'bun:test'
import {
  breadcrumbJsonLd,
  compositionJsonLd,
  compositionsItemListJsonLd,
  freeResourceJsonLd,
  organizationJsonLd,
  personJsonLd,
  productItemListJsonLd,
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

  test('compositionsItemListJsonLd: one ItemList, loops nested without their own @context', () => {
    const list = ld(compositionsItemListJsonLd([
      { slug: 'late-night', title: 'Late Night', previewUrl: 'https://cdn.shopify.com/late-night.mp3' },
      { slug: 'x', title: 'X' },
    ])) as Record<string, any>
    expect(list['@type']).toBe('ItemList')
    expect(list.numberOfItems).toBe(2)
    expect(list.itemListElement[0].position).toBe(1)
    expect(list.itemListElement[0].item['@type']).toBe('MusicComposition')
    expect(list.itemListElement[0].item['@context']).toBeUndefined()
    expect(list.itemListElement[1].item['@type']).toBe('CreativeWork')
    expect(list).toMatchSnapshot()
  })

  test('freeResourceJsonLd: free CreativeWork with a publisher', () => {
    const r = ld(freeResourceJsonLd({ slug: 'starter-kit', name: 'Starter Kit', imageUrl: '/free/starter.png' })) as Record<string, any>
    expect(r['@type']).toBe('CreativeWork')
    expect(r.isAccessibleForFree).toBe(true)
    expect(r.url).toBe('https://organicsonics.com/free/starter-kit')
    expect(r.image).toBe('https://organicsonics.com/free/starter.png')
    expect(r.description).toBeUndefined()
    expect(r).toMatchSnapshot()
  })

  test('productJsonLd: several license variants emit an AggregateOffer', () => {
    const money = (amount: string) => ({ amount, currencyCode: 'USD' })
    const p = ld(
      productJsonLd({
        ...product,
        licenseOptions: [
          { id: 'gid://shopify/ProductVariant/1', title: 'MP3 Lease', price: money('29.99'), availableForSale: true },
          { id: 'gid://shopify/ProductVariant/2', title: 'WAV Lease', price: money('49.99'), availableForSale: true },
          { id: 'gid://shopify/ProductVariant/3', title: 'Exclusive', price: money('299.0'), availableForSale: false },
        ],
      }),
    ) as Record<string, any>
    expect(p.offers).toEqual({
      '@type': 'AggregateOffer',
      url: 'https://organicsonics.com/store/night-drive',
      lowPrice: '29.99',
      highPrice: '299.0',
      offerCount: 3,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'Organic Sonics', url: 'https://organicsonics.com' },
    })
    expect(p).toMatchSnapshot()
  })

  test('productJsonLd: a single license option still emits a single Offer', () => {
    const p = ld(
      productJsonLd({
        ...product,
        licenseOptions: [{ id: 'v', title: 'Night Drive', price: { amount: '29.99', currencyCode: 'USD' }, availableForSale: true }],
      }),
    ) as Record<string, any>
    expect(p.offers['@type']).toBe('Offer')
    expect(p.offers.price).toBe('29.99')
  })

  test('productItemListJsonLd: store page ItemList', () => {
    const list = ld(productItemListJsonLd([{ handle: 'a', title: 'A' }, { handle: 'b', title: 'B' }])) as Record<string, any>
    expect(list['@type']).toBe('ItemList')
    expect(list.itemListElement[1]).toEqual({ '@type': 'ListItem', position: 2, url: 'https://organicsonics.com/store/b', name: 'B' })
  })
})

describe('personJsonLd (work with me)', () => {
  test('Person with deduped sameAs, absolute url and image, Organization employer', () => {
    const p = ld(
      personJsonLd({
        name: 'JUICEMAN',
        jobTitle: 'Music producer',
        path: '/work-with-me',
        imageUrl: 'https://i.scdn.co/image/a',
        sameAs: ['https://x.test/a', 'https://x.test/a', 'https://x.test/b'],
        knowsAbout: ['Mixing & Mastering'],
      }),
    ) as Record<string, any>
    expect(p['@type']).toBe('Person')
    expect(p.url).toBe('https://organicsonics.com/work-with-me')
    expect(p.image).toBe('https://i.scdn.co/image/a')
    expect(p.sameAs).toEqual(['https://x.test/a', 'https://x.test/b'])
    expect(p.worksFor).toEqual({ '@type': 'Organization', '@id': 'https://organicsonics.com/#organization', name: 'Organic Sonics' })
    expect(p.knowsAbout).toEqual(['Mixing & Mastering'])
  })

  test('no image or sameAs when unknown', () => {
    const p = ld(personJsonLd({ name: 'JUICEMAN', path: '/work-with-me', imageUrl: null })) as Record<string, any>
    expect(p.image).toBeUndefined()
    expect(p.sameAs).toBeUndefined()
    expect(JSON.stringify(p)).not.toContain('undefined')
  })
})
