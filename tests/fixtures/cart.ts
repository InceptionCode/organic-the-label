import type { Cart, CartLine } from '@/lib/schemas'

/**
 * Cart fixtures for unit and integration tests.
 * Shapes match lib/schemas.ts Cart and CartLine types exactly.
 */

export const mockCartLine: CartLine = {
  id: 'gid://shopify/CartLine/1',
  quantity: 1,
  merchandise: {
    id: 'gid://shopify/ProductVariant/1',
    title: 'Default Title',
    price: { amount: '29.99', currencyCode: 'USD' },
    product: { title: 'Sample Drum Kit', handle: 'sample-drum-kit' },
    image: {
      url: 'https://placehold.co/600x400',
      altText: 'Sample Drum Kit',
    },
  },
}

export const mockCart: Cart = {
  id: 'gid://shopify/Cart/abc123',
  checkoutUrl: 'https://organicsonics.myshopify.com/cart/c/abc123',
  totalQuantity: 1,
  cost: {
    totalAmount: { amount: '29.99', currencyCode: 'USD' },
  },
  lines: {
    edges: [{ node: mockCartLine }],
  },
}

export const emptyCart: Cart = {
  id: 'gid://shopify/Cart/empty',
  checkoutUrl: 'https://organicsonics.myshopify.com/cart/c/empty',
  totalQuantity: 0,
  cost: {
    totalAmount: { amount: '0.00', currencyCode: 'USD' },
  },
  lines: {
    edges: [],
  },
}

export const mockCartLineTwo: CartLine = {
  id: 'gid://shopify/CartLine/2',
  quantity: 3,
  merchandise: {
    id: 'gid://shopify/ProductVariant/2',
    title: 'Default Title',
    price: { amount: '9.99', currencyCode: 'USD' },
    product: { title: 'Starter Sample Pack', handle: 'starter-sample-pack' },
    image: {
      url: 'https://placehold.co/600x400',
      altText: 'Starter Sample Pack',
    },
  },
}

// totalQuantity: 1 + 3 = 4, totalAmount: 29.99 + (3 * 9.99) = 59.96
export const multiItemCart: Cart = {
  id: 'gid://shopify/Cart/multi',
  checkoutUrl: 'https://organicsonics.myshopify.com/cart/c/multi',
  totalQuantity: 4,
  cost: {
    totalAmount: { amount: '59.96', currencyCode: 'USD' },
  },
  lines: {
    edges: [{ node: mockCartLine }, { node: mockCartLineTwo }],
  },
}
