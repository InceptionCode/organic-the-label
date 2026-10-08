import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie } from '@tanstack/react-start/server'
import { z } from 'zod'
import { createShopifyClient } from './client'
import {
  CART_QUERY,
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  type Cart,
  type CartQueryResponse,
  type CartCreateResponse,
  type CartLinesAddResponse,
  type CartLinesUpdateResponse,
  type CartLinesRemoveResponse,
} from './cart-types'

const CART_COOKIE = 'cartId'

const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
}

// Returns the current cart or null if none exists / cart expired.
export const getCartFn = createServerFn({ method: 'GET' }).handler(async (): Promise<Cart | null> => {
  const cartId = getCookie(CART_COOKIE)
  if (!cartId) return null

  const client = createShopifyClient()
  const { data } = await client.request<CartQueryResponse>(CART_QUERY, { variables: { id: cartId } })
  return data?.cart ?? null
})

// Adds a variant to the cart. Creates a new cart if none exists.
export const addToCartFn = createServerFn({ method: 'POST' })
  .validator(z.object({ variantId: z.string(), quantity: z.number().int().min(1).default(1) }))
  .handler(async ({ data: { variantId, quantity } }): Promise<Cart> => {
    const client = createShopifyClient()
    const line = { merchandiseId: variantId, quantity }
    const cartId = getCookie(CART_COOKIE)

    if (!cartId) {
      const { data, errors } = await client.request<CartCreateResponse>(CART_CREATE_MUTATION, {
        variables: { lines: [line] },
      })
      if (errors || !data?.cartCreate?.cart) throw new Error(`Cart create failed: ${errors?.message ?? 'no data'}`)
      const cart = data.cartCreate.cart
      setCookie(CART_COOKIE, cart.id, cookieOpts)
      return cart
    }

    const { data, errors } = await client.request<CartLinesAddResponse>(CART_LINES_ADD_MUTATION, {
      variables: { cartId, lines: [line] },
    })

    if (!data?.cartLinesAdd?.cart) {
      // Cart expired or was converted — create a new one
      const { data: freshData, errors: freshErrors } = await client.request<CartCreateResponse>(
        CART_CREATE_MUTATION,
        { variables: { lines: [line] } },
      )
      if (freshErrors || !freshData?.cartCreate?.cart) {
        throw new Error(`Cart recovery failed: ${freshErrors?.message ?? 'no data'}`)
      }
      const fresh = freshData.cartCreate.cart
      setCookie(CART_COOKIE, fresh.id, cookieOpts)
      return fresh
    }

    if (errors) throw new Error(`Cart add failed: ${errors.message}`)
    return data.cartLinesAdd.cart
  })

// Updates the quantity of a specific line item.
export const setCartQtyFn = createServerFn({ method: 'POST' })
  .validator(z.object({ lineId: z.string(), quantity: z.number().int().min(0) }))
  .handler(async ({ data: { lineId, quantity } }): Promise<Cart> => {
    const cartId = getCookie(CART_COOKIE)
    if (!cartId) throw new Error('No active cart')

    const client = createShopifyClient()
    const { data, errors } = await client.request<CartLinesUpdateResponse>(CART_LINES_UPDATE_MUTATION, {
      variables: { cartId, lines: [{ id: lineId, quantity }] },
    })
    if (errors || !data?.cartLinesUpdate?.cart) throw new Error(`Cart update failed: ${errors?.message ?? 'no data'}`)
    return data.cartLinesUpdate.cart
  })

// Removes one or more line items from the cart.
export const removeCartLinesFn = createServerFn({ method: 'POST' })
  .validator(z.object({ lineIds: z.array(z.string()).min(1) }))
  .handler(async ({ data: { lineIds } }): Promise<Cart> => {
    const cartId = getCookie(CART_COOKIE)
    if (!cartId) throw new Error('No active cart')

    const client = createShopifyClient()
    const { data, errors } = await client.request<CartLinesRemoveResponse>(CART_LINES_REMOVE_MUTATION, {
      variables: { cartId, lineIds },
    })
    if (errors || !data?.cartLinesRemove?.cart) throw new Error(`Cart remove failed: ${errors?.message ?? 'no data'}`)
    return data.cartLinesRemove.cart
  })
