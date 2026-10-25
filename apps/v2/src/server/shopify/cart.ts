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
import type { CartLineInput, CartLineUpdateInput, CartResult } from './types'

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
