import { describe, expect, test } from 'bun:test'
import { cartMutationMessage, isFailedAdd } from '~/queries/cart'
import { CART_UNAVAILABLE_MESSAGE, type Cart } from '~/server/shopify/types'

const cart = { id: 'c1', checkoutUrl: '', totalQuantity: 0, lines: [] } as unknown as Cart

describe('cartMutationMessage', () => {
  test('pending and idle mutations show nothing', () => {
    expect(cartMutationMessage({ status: 'pending', data: undefined })).toBeNull()
    expect(cartMutationMessage({ status: 'idle', data: undefined })).toBeNull()
  })

  test('a thrown error always shows the fixed safe message, never the raw error text', () => {
    expect(cartMutationMessage({ status: 'error', data: undefined })).toBe(CART_UNAVAILABLE_MESSAGE)
  })

  test('a success with userErrors shows the first one', () => {
    const data = { cart, userErrors: [{ field: null, message: 'Sold out' }, { field: null, message: 'Other' }] }
    expect(cartMutationMessage({ status: 'success', data })).toBe('Sold out')
  })

  test('a clean success shows nothing', () => {
    expect(cartMutationMessage({ status: 'success', data: { cart, userErrors: [] } })).toBeNull()
  })
})

describe('isFailedAdd', () => {
  test('no cart or any userError is a failure', () => {
    expect(isFailedAdd({ cart: null, userErrors: [] })).toBe(true)
    expect(isFailedAdd({ cart, userErrors: [{ field: null, message: 'x' }] })).toBe(true)
    expect(isFailedAdd({ cart, userErrors: [] })).toBe(false)
  })
})
