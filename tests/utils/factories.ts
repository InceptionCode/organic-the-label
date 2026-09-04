import type { Product, Cart, User } from '@/lib/schemas'
import { mockProduct } from '../fixtures/products'
import { mockCart } from '../fixtures/cart'
import { signedInUser } from '../fixtures/users'

/**
 * Test data factories for generating variations of fixtures.
 *
 * Use these when you need slightly different data per test without
 * copy-pasting fixture objects everywhere.
 *
 * TODO: Expand these as you discover repeated patterns in your tests.
 */

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return { ...mockProduct, ...overrides }
}

export function makeCart(overrides: Partial<Cart> = {}): Cart {
  return { ...mockCart, ...overrides }
}

export function makeUser(overrides: Partial<User> = {}): User {
  return { ...signedInUser, ...overrides }
}
