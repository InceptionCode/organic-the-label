import { createServerFn } from '@tanstack/react-start'
import { deleteCookie, getCookie, getRequestHeader, setCookie } from '@tanstack/react-start/server'
import * as cartService from '~/server/shopify/cart'
import {
  addToCartInputSchema,
  CART_UNAVAILABLE_MESSAGE,
  removeCartLinesInputSchema,
  updateCartLineInputSchema,
  type CartOutcome,
  type CartResult,
} from '~/server/shopify/types'
import { toSafeError } from './errors'

// Same name as v1 so carts started on v1 survive the cutover on the same domain.
const CART_COOKIE = 'cartId'
// Shopify carts expire after about 10 days of inactivity; a null cart clears the cookie either way.
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 14

function buyerIp(): string | undefined {
  const forwarded = getRequestHeader('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || getRequestHeader('x-real-ip') || undefined
}

async function run(scope: string, fn: (cartId: string | undefined) => Promise<CartOutcome>): Promise<CartResult> {
  let outcome: CartOutcome
  try {
    outcome = await fn(getCookie(CART_COOKIE))
  } catch (error) {
    throw toSafeError(`cart.${scope}`, CART_UNAVAILABLE_MESSAGE, error)
  }
  const { cookie } = outcome
  if (cookie === 'clear') {
    deleteCookie(CART_COOKIE, { path: '/' })
  } else if (cookie !== 'keep') {
    setCookie(CART_COOKIE, cookie.set, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: CART_COOKIE_MAX_AGE,
    })
  }
  return outcome.result
}

export const getCartFn = createServerFn({ method: 'GET' }).handler(() =>
  run('get', (cartId) => cartService.loadCart(cartId, { buyerIp: buyerIp() })),
)

export const addToCartFn = createServerFn({ method: 'POST' })
  .validator(addToCartInputSchema)
  .handler(({ data }) =>
    run('add', (cartId) =>
      cartService.addToCart(cartId, [{ merchandiseId: data.variantId, quantity: data.quantity }], { buyerIp: buyerIp() }),
    ),
  )

export const updateCartLineFn = createServerFn({ method: 'POST' })
  .validator(updateCartLineInputSchema)
  .handler(({ data }) =>
    run('update', (cartId) => cartService.updateCartLine(cartId, data.lineId, data.quantity, { buyerIp: buyerIp() })),
  )

export const removeCartLinesFn = createServerFn({ method: 'POST' })
  .validator(removeCartLinesInputSchema)
  .handler(({ data }) => run('remove', (cartId) => cartService.removeCartLines(cartId, data.lineIds, { buyerIp: buyerIp() })))
