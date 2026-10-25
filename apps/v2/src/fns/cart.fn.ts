import { createServerFn } from '@tanstack/react-start'
import { deleteCookie, getCookie, getRequestHeader, setCookie } from '@tanstack/react-start/server'
import * as cartService from '~/server/shopify/cart'
import {
  addToCartInputSchema,
  removeCartLinesInputSchema,
  updateCartLinesInputSchema,
  type CartResult,
} from '~/server/shopify/types'
import { toSafeError } from './errors'

const CART_COOKIE = 'cartId'
const EMPTY: CartResult = { cart: null, userErrors: [] }

function writeCartCookie(cartId: string) {
  setCookie(CART_COOKIE, cartId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
}

function buyerIp(): string | undefined {
  const forwarded = getRequestHeader('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || getRequestHeader('x-real-ip') || undefined
}

async function run(scope: string, fn: () => Promise<CartResult>): Promise<CartResult> {
  try {
    return await fn()
  } catch (error) {
    throw toSafeError(`cart.${scope}`, 'Your cart could not be updated. Please try again.', error)
  }
}

export const getCartFn = createServerFn({ method: 'GET' }).handler(() =>
  run('get', async () => {
    const cartId = getCookie(CART_COOKIE)
    if (!cartId) return EMPTY
    const result = await cartService.getCart(cartId, { buyerIp: buyerIp() })
    // Completed or expired carts come back null; drop the stale cookie.
    if (!result.cart) deleteCookie(CART_COOKIE, { path: '/' })
    return result
  }),
)

export const addToCartFn = createServerFn({ method: 'POST' })
  .validator(addToCartInputSchema)
  .handler(({ data }) =>
    run('add', async () => {
      const opts = { buyerIp: buyerIp() }
      const lines = [{ merchandiseId: data.variantId, quantity: data.quantity }]
      const cartId = getCookie(CART_COOKIE)

      if (cartId) {
        const result = await cartService.addLines(cartId, lines, opts)
        if (result.cart && result.cart.id !== cartId) {
          // Shopify answers a stale cartId with a brand new cart plus a cartId userError.
          writeCartCookie(result.cart.id)
          return { cart: result.cart, userErrors: result.userErrors.filter((e) => e.field?.[0] !== 'cartId') }
        }
        if (result.cart) return result
        // No cart back means either bad lines (cart still exists) or a converted/expired cart.
        const existing = await cartService.getCart(cartId, opts)
        if (existing.cart) return { cart: existing.cart, userErrors: result.userErrors }
      }

      const created = await cartService.createCart(lines, opts)
      if (created.cart) writeCartCookie(created.cart.id)
      return created
    }),
  )

export const updateCartLinesFn = createServerFn({ method: 'POST' })
  .validator(updateCartLinesInputSchema)
  .handler(({ data }) =>
    run('update', async () => {
      const cartId = getCookie(CART_COOKIE)
      if (!cartId) return EMPTY
      return cartService.updateLines(cartId, data.lines, { buyerIp: buyerIp() })
    }),
  )

export const removeCartLinesFn = createServerFn({ method: 'POST' })
  .validator(removeCartLinesInputSchema)
  .handler(({ data }) =>
    run('remove', async () => {
      const cartId = getCookie(CART_COOKIE)
      if (!cartId) return EMPTY
      return cartService.removeLines(cartId, data.lineIds, { buyerIp: buyerIp() })
    }),
  )
