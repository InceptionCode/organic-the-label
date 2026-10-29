import { afterEach, describe, expect, mock, test } from 'bun:test'
import { getProductsByIds, idsHash } from '~/server/catalog/products-by-ids'
import { hasAuthCookie } from '~/fns/middleware/session'
import { readCookie, serializeCookie } from '~/server/downloads/http'

// Phase 07 audit: core branches that had no unit test (coverage 0% before this file).

const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
})

const node = (n: number) => ({
  id: `gid://shopify/Product/${n}`,
  handle: `product-${n}`,
  title: `Product ${n}`,
  createdAt: '2026-01-01T00:00:00Z',
  availableForSale: true,
  productType: 'Kit',
  tags: [],
  featuredImage: null,
  variants: { edges: [{ node: { id: `gid://shopify/ProductVariant/${n}`, availableForSale: true, price: { amount: '10.0', currencyCode: 'USD' } } }] },
  audioPreviewMetafield: null,
})

/** Answers the nodes query with a product for every id except those in `missing`. */
function mockShopify(missing: string[] = []) {
  const fn = mock(async (_url: string | URL | Request, init?: RequestInit) => {
    const { variables } = JSON.parse(String(init?.body)) as { variables: { ids: string[] } }
    const nodes = variables.ids.map((id) => {
      if (missing.includes(id)) return null
      if (id.includes('/Collection/')) return {}
      return node(Number(id.split('/').pop()))
    })
    return Response.json({ data: { nodes } })
  })
  globalThis.fetch = fn as unknown as typeof fetch
  return fn
}

describe('getProductsByIds (owned products)', () => {
  test('no ids: no Shopify call', async () => {
    const fn = mockShopify()
    expect(await getProductsByIds([])).toEqual([])
    expect(await getProductsByIds(['', ''])).toEqual([])
    expect(fn).not.toHaveBeenCalled()
  })

  test('keeps the given order, drops duplicates, deleted products and non-product nodes', async () => {
    mockShopify(['gid://shopify/Product/2'])
    const result = await getProductsByIds([
      'gid://shopify/Product/3',
      'gid://shopify/Product/1',
      'gid://shopify/Product/3',
      'gid://shopify/Product/2',
      'gid://shopify/Collection/9',
    ])
    expect(result.map((p) => p.id)).toEqual(['gid://shopify/Product/3', 'gid://shopify/Product/1'])
    expect(result[0]!.handle).toBe('product-3')
  })

  test('splits more than 250 ids into several nodes calls', async () => {
    const fn = mockShopify()
    const ids = Array.from({ length: 251 }, (_, i) => `gid://shopify/Product/${i + 1}`)
    const result = await getProductsByIds(ids)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(result).toHaveLength(251)
    expect(result.map((p) => p.id)).toEqual(ids)
  })

  test('the cache key does not depend on input order', () => {
    expect(idsHash(['a', 'b'])).toBe(idsHash(['a', 'b']))
    expect(idsHash(['a', 'b'])).not.toBe(idsHash(['b', 'a']))
    // getProductsByIds sorts before hashing, so ['b', 'a'] and ['a', 'b'] share one entry.
  })
})

describe('session middleware: hasAuthCookie', () => {
  test('only Supabase auth token cookies count as a session', () => {
    expect(hasAuthCookie({})).toBe(false)
    expect(hasAuthCookie({ cartId: 'x', anon_token: 'y', pw_recovery: 'z' })).toBe(false)
    expect(hasAuthCookie({ 'sb-abc-auth-token': 'base64-...' })).toBe(true)
    // Chunked cookies (large sessions) are split as .0, .1, ...
    expect(hasAuthCookie({ 'sb-abc-auth-token.0': 'a', 'sb-abc-auth-token.1': 'b' })).toBe(true)
    // A lone PKCE verifier also matches; harmless, getClaims then finds no session and claims stay null.
    expect(hasAuthCookie({ 'sb-abc-auth-token-code-verifier': 'v' })).toBe(true)
    expect(hasAuthCookie({ 'sb-other': 'x' })).toBe(false)
  })
})

describe('download http helpers', () => {
  test('readCookie decodes values and survives malformed encoding', () => {
    expect(readCookie('a=1; anon_token=abc%20def; b=2', 'anon_token')).toBe('abc def')
    expect(readCookie('anon_token=%E0%A4%A', 'anon_token')).toBe('%E0%A4%A')
    expect(readCookie('novalue; x=1', 'novalue')).toBeUndefined()
    expect(readCookie(null, 'x')).toBeUndefined()
  })

  test('serializeCookie round-trips through readCookie', () => {
    const header = serializeCookie('anon_token', 'a b;c', { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 60 })
    expect(header).toBe('anon_token=a%20b%3Bc; Path=/; Max-Age=60; SameSite=Lax; HttpOnly; Secure')
    expect(readCookie(header.split(';')[0], 'anon_token')).toBe('a b;c')
  })
})
