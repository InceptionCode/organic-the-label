// Cart types ported from lib/Shopify/queries.ts + lib/Shopify/mutations.ts

export type CartLine = {
  id: string
  quantity: number
  merchandise: {
    id: string
    title: string
    product: { handle: string; title: string }
    image: { url: string; altText: string; width: string; height: string }
    price: { amount: string; currencyCode: string }
  }
}

export type Cart = {
  id: string
  checkoutUrl: string
  totalQuantity: number
  cost: {
    subtotalAmount: { amount: string; currencyCode: string }
    totalAmount: { amount: string; currencyCode: string }
  }
  lines: { edges: Array<{ node: CartLine }> }
}

export type CartCreateResponse = {
  cartCreate: { cart: Cart; userErrors?: { field: string; message: string } }
}
export type CartLinesAddResponse = {
  cartLinesAdd: { cart: Cart; userErrors?: { field: string; message: string } }
}
export type CartLinesUpdateResponse = {
  cartLinesUpdate: { cart: Cart; userErrors?: { field: string; message: string } }
}
export type CartLinesRemoveResponse = {
  cartLinesRemove: { cart: Cart; userErrors?: { field: string; message: string } }
}
export type CartQueryResponse = { cart: Cart | null }

export const CART_FRAGMENT = `
  fragment CartFragment on Cart {
    id checkoutUrl totalQuantity
    cost {
      subtotalAmount { amount currencyCode }
      totalAmount { amount currencyCode }
    }
    lines(first: 50) {
      edges {
        node {
          id quantity
          merchandise {
            ... on ProductVariant {
              id title
              product { handle title }
              image { url altText width height }
              price { amount currencyCode }
            }
          }
        }
      }
    }
  }
`

export const CART_QUERY = `
  ${CART_FRAGMENT}
  query Cart($id: ID!) { cart(id: $id) { ...CartFragment } }
`

export const CART_CREATE_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartCreate($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) {
      cart { ...CartFragment }
      userErrors { field message }
    }
  }
`

export const CART_LINES_ADD_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...CartFragment }
      userErrors { field message }
    }
  }
`

export const CART_LINES_UPDATE_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ...CartFragment }
      userErrors { field message }
    }
  }
`

export const CART_LINES_REMOVE_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ...CartFragment }
      userErrors { field message }
    }
  }
`
