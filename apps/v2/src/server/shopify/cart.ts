import { shopifyQuery, type ShopifyQueryOptions } from './client'
import { parseCart } from './parse'
import {
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_QUERY,
  type CartCreateData,
  type CartCreateVars,
  type CartData,
  type CartVars,
  type CartLinesAddData,
  type CartLinesAddVars,
  type CartLinesRemoveData,
  type CartLinesRemoveVars,
  type CartLinesUpdateData,
  type CartLinesUpdateVars,
  type RawCart,
  type RawCartUserError,
} from './queries'
import type { CartLineInput, CartLineUpdateInput, CartOutcome, CartResult, CartUserError } from './types'

// Carts are per-buyer and never cached. Network and GraphQL failures throw ShopifyError;
// Shopify userErrors come back in the result so callers can show them.

function toResult(payload: { cart: RawCart | null; userErrors: RawCartUserError[] }): CartResult {
  return {
    cart: parseCart(payload.cart),
    userErrors: payload.userErrors.map((e) => ({ field: e.field, message: e.message, code: e.code ?? null })),
  }
}

export async function getCart(cartId: string, opts?: ShopifyQueryOptions): Promise<CartResult> {
  const data = await shopifyQuery<CartData, CartVars>(CART_QUERY, { id: cartId }, opts)
  return { cart: parseCart(data.cart), userErrors: [] }
}

export async function createCart(lines: CartLineInput[], opts?: ShopifyQueryOptions): Promise<CartResult> {
  const data = await shopifyQuery<CartCreateData, CartCreateVars>(CART_CREATE_MUTATION, { lines }, opts)
  return toResult(data.cartCreate)
}

export async function addLines(cartId: string, lines: CartLineInput[], opts?: ShopifyQueryOptions): Promise<CartResult> {
  const data = await shopifyQuery<CartLinesAddData, CartLinesAddVars>(CART_LINES_ADD_MUTATION, { cartId, lines }, opts)
  return toResult(data.cartLinesAdd)
}

export async function updateLines(
  cartId: string,
  lines: CartLineUpdateInput[],
  opts?: ShopifyQueryOptions,
): Promise<CartResult> {
  const data = await shopifyQuery<CartLinesUpdateData, CartLinesUpdateVars>(
    CART_LINES_UPDATE_MUTATION,
    { cartId, lines },
    opts,
  )
  return toResult(data.cartLinesUpdate)
}

export async function removeLines(cartId: string, lineIds: string[], opts?: ShopifyQueryOptions): Promise<CartResult> {
  const data = await shopifyQuery<CartLinesRemoveData, CartLinesRemoveVars>(
    CART_LINES_REMOVE_MUTATION,
    { cartId, lineIds },
    opts,
  )
  return toResult(data.cartLinesRemove)
}

// ---------------------------------------------------------------------------
// Flows used by the server fn adapter. Each takes the cookie's cart id (or null) and
// returns the result plus a cookie instruction, so the adapter alone touches cookies.

export const CART_GONE_MESSAGE = 'Your cart has expired. Add an item to start a new one.'
const LINE_FAILED_MESSAGE = 'Your cart could not be updated. Please try again.'
const ADD_FAILED_MESSAGE = 'That item could not be added to your cart.'

const gone = (): CartResult => ({ cart: null, userErrors: [{ field: null, message: CART_GONE_MESSAGE, code: 'CART_GONE' }] })
const orFallback = (errors: CartUserError[], message: string): CartUserError[] =>
  errors.length > 0 ? errors : [{ field: null, message, code: null }]

export async function loadCart(cartId: string | null | undefined, opts?: ShopifyQueryOptions): Promise<CartOutcome> {
  if (!cartId) return { result: { cart: null, userErrors: [] }, cookie: 'keep' }
  const result = await getCart(cartId, opts)
  // Completed (converted to an order) or expired carts come back null.
  return { result, cookie: result.cart ? 'keep' : 'clear' }
}

/** Adds lines, creating a cart when there is none and self-healing a stale or converted cart id (v1 rule). */
export async function addToCart(
  cartId: string | null | undefined,
  lines: CartLineInput[],
  opts?: ShopifyQueryOptions,
): Promise<CartOutcome> {
  if (cartId) {
    const added = await addLines(cartId, lines, opts)
    if (added.cart && added.cart.id !== cartId) {
      // Shopify can answer a stale cartId with a brand new cart plus a cartId userError.
      return {
        result: { cart: added.cart, userErrors: added.userErrors.filter((e) => e.field?.[0] !== 'cartId') },
        cookie: { set: added.cart.id },
      }
    }
    if (added.cart) return { result: added, cookie: 'keep' }
    // No cart back: either the lines were rejected (cart still exists) or the cart is gone.
    const existing = await getCart(cartId, opts)
    if (existing.cart) {
      return { result: { cart: existing.cart, userErrors: orFallback(added.userErrors, ADD_FAILED_MESSAGE) }, cookie: 'keep' }
    }
  }

  const created = await createCart(lines, opts)
  if (created.cart) return { result: created, cookie: { set: created.cart.id } }
  return {
    result: { cart: null, userErrors: orFallback(created.userErrors, ADD_FAILED_MESSAGE) },
    cookie: cartId ? 'clear' : 'keep',
  }
}

/** Resolves a line mutation: empty carts drop the cookie; a missing cart is re-read to tell "rejected" from "gone". */
async function settle(cartId: string, result: CartResult, opts?: ShopifyQueryOptions): Promise<CartOutcome> {
  if (result.cart) return { result, cookie: result.cart.lines.length === 0 ? 'clear' : 'keep' }
  const existing = await getCart(cartId, opts)
  if (existing.cart) {
    return { result: { cart: existing.cart, userErrors: orFallback(result.userErrors, LINE_FAILED_MESSAGE) }, cookie: 'keep' }
  }
  return { result: gone(), cookie: 'clear' }
}

export async function removeCartLines(
  cartId: string | null | undefined,
  lineIds: string[],
  opts?: ShopifyQueryOptions,
): Promise<CartOutcome> {
  if (!cartId) return { result: gone(), cookie: 'keep' }
  return settle(cartId, await removeLines(cartId, lineIds, opts), opts)
}

/** Sets one line's quantity; 0 removes the line (v1 setQty rule). */
export async function updateCartLine(
  cartId: string | null | undefined,
  lineId: string,
  quantity: number,
  opts?: ShopifyQueryOptions,
): Promise<CartOutcome> {
  if (quantity <= 0) return removeCartLines(cartId, [lineId], opts)
  if (!cartId) return { result: gone(), cookie: 'keep' }
  return settle(cartId, await updateLines(cartId, [{ id: lineId, quantity }], opts), opts)
}
