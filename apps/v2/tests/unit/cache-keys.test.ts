import { describe, expect, test } from 'bun:test'
import { keys, ttl } from '~/server/cache/keys'

// Patterns apps/api busts (apps/api/src/lib/cache.ts).
const BUSTED = [/^product:handle:.+/, /^shopify:products:.+/, /^compositions:.+/, /^free-resources:.+/]

describe('cache keys', () => {
  const samples: string[] = [
    keys.productByHandle('night-drive'),
    keys.productList('sort=newest'),
    keys.productsNewest(5),
    keys.productsSitemap(),
    keys.productSearch('Drums'),
    keys.productsByIds('abc123'),
    keys.compositionsList(),
    keys.compositionBySlug('song'),
    keys.compositionsSitemap(),
    keys.compositionsRecent(4),
    keys.compositionsSearch('808 drums'),
    keys.freeResourcesList(),
    keys.freeResourceBySlug('kit'),
    keys.freeResourcesSitemap(),
    keys.compositionsListBy('range=all|sort=newest|tags=-|search=-'),
    keys.freeResourceFeatured(),
  ]

  // TTL-only keys, deliberately outside the apps/api busting contract (pages/work-with-me.md).
  const ttlOnly: string[] = [keys.workWithMeSpotify(), keys.workWithMeYoutube(), keys.workWithMeInstagram()]

  test('every key builder is covered by the samples', () => {
    expect(samples.length + ttlOnly.length).toBe(Object.keys(keys).length)
  })

  test.each(ttlOnly)('%s is TTL only (no busted prefix)', (key) => {
    expect(key.startsWith('work-with-me:')).toBe(true)
    expect(BUSTED.some((re) => re.test(key))).toBe(false)
  })

  test.each(samples)('%s matches a busted prefix', (key) => {
    expect(BUSTED.some((re) => re.test(key))).toBe(true)
  })

  test('exact shapes apps/api depends on', () => {
    expect(keys.productByHandle('x')).toBe('product:handle:x')
    expect(keys.productsSitemap()).toBe('shopify:products:sitemap')
    expect(keys.productSearch('AbC')).toBe('shopify:products:search:abc')
  })

  test('TTLs', () => {
    expect(ttl.product).toBe(2_592_000)
    expect(ttl.productList).toBe(900)
    expect(ttl.productSearch).toBe(300)
  })
})
