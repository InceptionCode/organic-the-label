import { describe, expect, test } from 'bun:test'
import { isAllowedTag } from '~/server/cache/purge'
import {
  CDN_TAG,
  PRIVATE_NO_STORE,
  PUBLIC_PAGE_CACHE_CONTROL,
  cookieNames,
  guardCacheControl,
  isSharedCacheable,
  productTag,
  publicPageHeaders,
  type CacheGuardInput,
} from '~/server/http/cache-headers'

const anon: CacheGuardInput = {
  method: 'GET',
  pathname: '/store',
  status: 200,
  requestCookies: [],
  setsCookie: false,
  cacheControl: PUBLIC_PAGE_CACHE_CONTROL,
}

describe('publicPageHeaders', () => {
  test('is the shared s-maxage policy plus the Vercel cache tags', () => {
    expect(publicPageHeaders([CDN_TAG.products, ...productTag('wave-pack')])).toEqual({
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
      'Vercel-Cache-Tag': 'products,product:wave-pack',
    })
  })
  test('productTag skips handles that are not plain Shopify handles', () => {
    expect(productTag('wave-pack')).toEqual(['product:wave-pack'])
    for (const handle of ['Wave', 'a,b', 'a b', '', 'x'.repeat(201)]) expect(productTag(handle)).toEqual([])
  })
  test('every tag a page can carry passes the purge allow-list', () => {
    for (const tag of [...Object.values(CDN_TAG), ...productTag('wave-pack')]) expect(isAllowedTag(tag)).toBe(true)
  })
})

describe('guardCacheControl', () => {
  test('leaves an anonymous GET or HEAD 200 public', () => {
    expect(guardCacheControl(anon)).toBeNull()
    expect(guardCacheControl({ ...anon, method: 'HEAD' })).toBeNull()
  })

  test('anonymous visitor cookies (cartId, anon_token, theme) do not block caching', () => {
    expect(guardCacheControl({ ...anon, requestCookies: ['cartId', 'anon_token', 'theme'] })).toBeNull()
  })

  test('any sb- cookie forces private', () => {
    expect(guardCacheControl({ ...anon, requestCookies: ['cartId', 'sb-abc-auth-token'] })).toBe(PRIVATE_NO_STORE)
    expect(guardCacheControl({ ...anon, requestCookies: ['sb-abc-auth-token.0'] })).toBe(PRIVATE_NO_STORE)
  })

  test('a Set-Cookie on the response forces private', () => {
    expect(guardCacheControl({ ...anon, setsCookie: true })).toBe(PRIVATE_NO_STORE)
  })

  test('non-GET methods force private', () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
      expect(guardCacheControl({ ...anon, method })).toBe(PRIVATE_NO_STORE)
    }
  })

  test('non-200 statuses force private (404, 500, redirects)', () => {
    for (const status of [301, 302, 307, 404, 500]) {
      expect(guardCacheControl({ ...anon, status })).toBe(PRIVATE_NO_STORE)
    }
  })

  test('never-public paths force private even with a public header', () => {
    for (const pathname of [
      '/api/track',
      '/auth/confirm',
      '/account',
      '/login',
      '/login/reset-password',
      '/signup',
      '/search',
      '/free/download/abc',
      '/compositions/download/loop',
      '/_serverFn/abc',
    ]) {
      expect(guardCacheControl({ ...anon, pathname })).toBe(PRIVATE_NO_STORE)
    }
  })

  test('similar public paths are not caught by the never-public list', () => {
    for (const pathname of ['/', '/store/wave-pack', '/compositions', '/free', '/free/starter-kit', '/explore', '/contact']) {
      expect(guardCacheControl({ ...anon, pathname })).toBeNull()
    }
  })

  test('responses that are not shared-cacheable are left alone', () => {
    expect(guardCacheControl({ ...anon, cacheControl: null, requestCookies: ['sb-x-auth-token'] })).toBeNull()
    expect(guardCacheControl({ ...anon, cacheControl: 'private, no-store', setsCookie: true })).toBeNull()
    expect(guardCacheControl({ ...anon, cacheControl: 'no-store', method: 'POST' })).toBeNull()
  })

  test('sitemap and robots keep their own public header for anonymous requests', () => {
    const sitemap = { ...anon, pathname: '/sitemap.xml', cacheControl: 'public, s-maxage=3600, stale-while-revalidate=86400' }
    expect(guardCacheControl(sitemap)).toBeNull()
    expect(guardCacheControl({ ...sitemap, pathname: '/robots.txt' })).toBeNull()
  })
})

describe('isSharedCacheable', () => {
  test('public or s-maxage without private/no-store', () => {
    expect(isSharedCacheable('public, max-age=0')).toBe(true)
    expect(isSharedCacheable('s-maxage=60')).toBe(true)
    expect(isSharedCacheable('public, no-store')).toBe(false)
    expect(isSharedCacheable('private, max-age=3600')).toBe(false)
    expect(isSharedCacheable('max-age=60')).toBe(false)
    expect(isSharedCacheable(undefined)).toBe(false)
  })
})

describe('cookieNames', () => {
  test('parses a Cookie header', () => {
    expect(cookieNames('cartId=1; sb-x-auth-token=abc; theme=dark')).toEqual(['cartId', 'sb-x-auth-token', 'theme'])
    expect(cookieNames('')).toEqual([])
    expect(cookieNames(null)).toEqual([])
  })
})
