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
    keys.compositionsList(),
    keys.compositionBySlug('song'),
    keys.compositionsSitemap(),
    keys.freeResourcesList(),
    keys.freeResourceBySlug('kit'),
    keys.freeResourcesSitemap(),
  ]

  test('every key builder is covered by the samples', () => {
    expect(samples).toHaveLength(Object.keys(keys).length)
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
    expect(ttl.product).toBe(3600)
    expect(ttl.productList).toBe(3600)
    expect(ttl.productSearch).toBe(300)
  })
})
