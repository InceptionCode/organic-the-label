import { afterEach, describe, expect, mock, test } from 'bun:test'
import { createShopifyClient, ShopifyError } from '~/server/shopify/client'

const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
})

const query = createShopifyClient({ storeDomain: 'shop.example.com', accessToken: 'tok_123', apiVersion: '2026-01' })

function mockFetch(response: Response) {
  const fn = mock(async (_url: string | URL | Request, _init?: RequestInit) => response)
  globalThis.fetch = fn as unknown as typeof fetch
  return fn
}

describe('shopifyQuery', () => {
  test('posts the document and returns data', async () => {
    const fn = mockFetch(Response.json({ data: { shop: { name: 'Test' } } }))
    const data = await query<{ shop: { name: string } }>('query { shop { name } }', { a: 1 }, { buyerIp: '1.2.3.4' })

    expect(data.shop.name).toBe('Test')
    const [url, init] = fn.mock.calls[0]!
    expect(url).toBe('https://shop.example.com/api/2026-01/graphql.json')
    expect(init?.method).toBe('POST')
    const headers = init?.headers as Record<string, string>
    expect(headers['Shopify-Storefront-Private-Token']).toBe('tok_123')
    expect(headers['Shopify-Storefront-Buyer-IP']).toBe('1.2.3.4')
    expect(JSON.parse(init?.body as string)).toEqual({ query: 'query { shop { name } }', variables: { a: 1 } })
    expect(init?.signal).toBeInstanceOf(AbortSignal)
  })

  test('omits the buyer IP header when not given', async () => {
    const fn = mockFetch(Response.json({ data: {} }))
    await query('query { shop { name } }')
    const headers = fn.mock.calls[0]![1]?.headers as Record<string, string>
    expect(headers['Shopify-Storefront-Buyer-IP']).toBeUndefined()
  })

  test('throws ShopifyError on a non-2xx response', async () => {
    mockFetch(new Response('nope', { status: 502 }))
    const error = await query('query { x }').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ShopifyError)
    expect((error as ShopifyError).status).toBe(502)
  })

  test('throws ShopifyError when GraphQL errors are present', async () => {
    mockFetch(Response.json({ data: null, errors: [{ message: 'Field x does not exist' }] }))
    const error = await query('query { x }').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ShopifyError)
    expect((error as ShopifyError).message).toContain('Field x does not exist')
    expect((error as ShopifyError).graphqlErrors).toHaveLength(1)
  })

  test('wraps network failures in ShopifyError', async () => {
    globalThis.fetch = mock(async () => {
      throw new TypeError('fetch failed')
    }) as unknown as typeof fetch
    await expect(query('query { x }')).rejects.toBeInstanceOf(ShopifyError)
  })
})

test('normalizes a store domain that includes a scheme', async () => {
  const fn = mockFetch(Response.json({ data: {} }))
  const q = createShopifyClient({ storeDomain: 'https://shop.example.com/', accessToken: 't', apiVersion: '2026-01' })
  await q('query { x }')
  expect(fn.mock.calls[0]![0]).toBe('https://shop.example.com/api/2026-01/graphql.json')
})
