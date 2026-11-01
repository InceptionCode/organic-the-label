import { afterEach, describe, expect, mock, test } from 'bun:test'
import { addToCart, CART_GONE_MESSAGE, loadCart, removeCartLines, updateCartLine } from '~/server/shopify/cart'
import type { RawCart } from '~/server/shopify/queries'

const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
})

function rawCart(id: string, lineCount = 1): RawCart {
  const money = { amount: '10.0', currencyCode: 'USD' }
  return {
    id,
    checkoutUrl: `https://shop.example.com/checkouts/${id}`,
    totalQuantity: lineCount,
    cost: { subtotalAmount: money, totalAmount: money },
    lines: {
      edges: Array.from({ length: lineCount }, (_, i) => ({
        node: {
          id: `line-${i}`,
          quantity: 1,
          merchandise: { id: `variant-${i}`, title: 'Default Title', product: { handle: 'wave', title: 'Wave' }, image: null, price: money },
        },
      })),
    },
  }
}

type Call = { query: string; variables: Record<string, unknown> }

/** Answers Shopify calls in order with the given `data` payloads and records each request. */
function shopify(...responses: unknown[]) {
  const calls: Call[] = []
  globalThis.fetch = mock(async (_url: string | URL | Request, init?: RequestInit) => {
    calls.push(JSON.parse(init?.body as string) as Call)
    const data = responses.shift()
    if (data === undefined) throw new Error('unexpected Shopify call')
    return Response.json({ data })
  }) as unknown as typeof fetch
  return calls
}

const op = (call: Call) => /(?:query|mutation) (\w+)/.exec(call.query)?.[1]
const payload = (cart: RawCart | null, userErrors: { field: string[] | null; message: string }[] = []) => ({ cart, userErrors })

describe('loadCart', () => {
  test('no cookie: empty result without calling Shopify', async () => {
    const calls = shopify()
    expect(await loadCart(undefined)).toEqual({ result: { cart: null, userErrors: [] }, cookie: 'keep' })
    expect(calls).toHaveLength(0)
  })

  test('a completed or expired cart clears the cookie', async () => {
    shopify({ cart: null })
    expect(await loadCart('gid://shopify/Cart/old')).toEqual({ result: { cart: null, userErrors: [] }, cookie: 'clear' })
  })

  test('a live cart keeps the cookie', async () => {
    shopify({ cart: rawCart('c1') })
    const out = await loadCart('c1')
    expect(out.cookie).toBe('keep')
    expect(out.result.cart?.lines).toHaveLength(1)
  })
})

describe('addToCart', () => {
  const lines = [{ merchandiseId: 'variant-0', quantity: 1 }]

  test('no cookie: creates a cart and sets the cookie', async () => {
    const calls = shopify({ cartCreate: payload(rawCart('new')) })
    const out = await addToCart(null, lines)
    expect(op(calls[0]!)).toBe('CartCreate')
    expect(out.cookie).toEqual({ set: 'new' })
  })

  test('existing cart: adds lines and keeps the cookie', async () => {
    const calls = shopify({ cartLinesAdd: payload(rawCart('c1')) })
    const out = await addToCart('c1', lines)
    expect(op(calls[0]!)).toBe('CartLinesAdd')
    expect(calls[0]!.variables).toEqual({ cartId: 'c1', lines })
    expect(out.cookie).toBe('keep')
  })

  test('stale cart answered with a new cart: resets the cookie and drops the cartId userError', async () => {
    shopify({ cartLinesAdd: payload(rawCart('fresh'), [{ field: ['cartId'], message: 'Cart not found' }]) })
    const out = await addToCart('stale', lines)
    expect(out.cookie).toEqual({ set: 'fresh' })
    expect(out.result.userErrors).toEqual([])
  })

  test('converted cart (no cart back, cart gone): silently creates a new cart', async () => {
    const calls = shopify(
      { cartLinesAdd: payload(null, [{ field: ['cartId'], message: 'The specified cart does not exist.' }]) },
      { cart: null },
      { cartCreate: payload(rawCart('fresh')) },
    )
    const out = await addToCart('converted', lines)
    expect(calls.map(op)).toEqual(['CartLinesAdd', 'Cart', 'CartCreate'])
    expect(out).toMatchObject({ cookie: { set: 'fresh' }, result: { userErrors: [] } })
  })

  test('rejected lines on a live cart: returns the cart with the error, cookie kept', async () => {
    shopify({ cartLinesAdd: payload(null, [{ field: ['lines'], message: 'Variant is sold out' }]) }, { cart: rawCart('c1') })
    const out = await addToCart('c1', lines)
    expect(out.cookie).toBe('keep')
    expect(out.result.cart?.id).toBe('c1')
    expect(out.result.userErrors[0]?.message).toBe('Variant is sold out')
  })
})

describe('updateCartLine', () => {
  test('quantity above zero updates the line', async () => {
    const calls = shopify({ cartLinesUpdate: payload(rawCart('c1')) })
    const out = await updateCartLine('c1', 'line-0', 3)
    expect(op(calls[0]!)).toBe('CartLinesUpdate')
    expect(calls[0]!.variables).toEqual({ cartId: 'c1', lines: [{ id: 'line-0', quantity: 3 }] })
    expect(out.cookie).toBe('keep')
  })

  test('quantity zero removes the line instead', async () => {
    const calls = shopify({ cartLinesRemove: payload(rawCart('c1', 0)) })
    const out = await updateCartLine('c1', 'line-0', 0)
    expect(op(calls[0]!)).toBe('CartLinesRemove')
    expect(calls[0]!.variables).toEqual({ cartId: 'c1', lineIds: ['line-0'] })
    expect(out.cookie).toBe('clear')
  })

  test('cart gone: clears the cookie and reports it', async () => {
    shopify({ cartLinesUpdate: payload(null, [{ field: ['cartId'], message: 'not found' }]) }, { cart: null })
    const out = await updateCartLine('gone', 'line-0', 2)
    expect(out.cookie).toBe('clear')
    expect(out.result.cart).toBeNull()
    expect(out.result.userErrors[0]?.message).toBe(CART_GONE_MESSAGE)
  })

  test('no cookie: reports a gone cart without calling Shopify', async () => {
    const calls = shopify()
    const out = await updateCartLine(undefined, 'line-0', 2)
    expect(calls).toHaveLength(0)
    expect(out.result.userErrors[0]?.message).toBe(CART_GONE_MESSAGE)
  })
})

describe('removeCartLines', () => {
  test('lines left: keeps the cookie', async () => {
    shopify({ cartLinesRemove: payload(rawCart('c1', 1)) })
    expect((await removeCartLines('c1', ['line-1'])).cookie).toBe('keep')
  })

  test('cart emptied: clears the cookie but returns the empty cart', async () => {
    shopify({ cartLinesRemove: payload(rawCart('c1', 0)) })
    const out = await removeCartLines('c1', ['line-0'])
    expect(out.cookie).toBe('clear')
    expect(out.result.cart?.lines).toEqual([])
  })

  test('rejected on a live cart: keeps the cart, falls back to a generic message', async () => {
    shopify({ cartLinesRemove: payload(null) }, { cart: rawCart('c1') })
    const out = await removeCartLines('c1', ['nope'])
    expect(out.cookie).toBe('keep')
    expect(out.result.cart?.id).toBe('c1')
    expect(out.result.userErrors[0]?.message).toBe('Your cart could not be updated. Please try again.')
  })

  test('network failure throws (the adapter maps it to a safe message)', async () => {
    globalThis.fetch = mock(async () => {
      throw new TypeError('fetch failed')
    }) as unknown as typeof fetch
    await expect(removeCartLines('c1', ['line-0'])).rejects.toThrow('Shopify request failed')
  })
})
