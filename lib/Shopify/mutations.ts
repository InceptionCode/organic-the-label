import { CART_FRAGMENT, CartQueryResponse } from "@/lib/Shopify/queries";

export type CartCreateResponse = {
  cartCreate: {
    cart: CartQueryResponse,
    userErrors?: {
      field: string;
      message: string;
    }
  }
}

export type CartLinesAddResponse = {
  cartLinesAdd: {
    cart: CartQueryResponse,
    userErrors?: {
      field: string;
      message: string;
    }
  }
}

export type CartLinesRemove = {
  cartLinesRemove: {
    cart: CartQueryResponse,
    userErrors?: {
      field: string;
      message: string;
    }
  }
}

export type CartResponse = {
  cart: CartQueryResponse
}

export interface CartState<CartResponseType = CartResponse | CartCreateResponse | CartLinesAddResponse | CartLinesRemove> {
  ok: boolean,
  errors?: unknown | undefined | null,
  response?: CartResponseType
}

export const CART_CREATE_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartCreate($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) {
      cart { ...CartFragment }
      userErrors { field message }
    }
  }
`;

export const CART_LINES_ADD_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...CartFragment }
      userErrors { field message }
    }
  }
`;

export const CART_LINES_REMOVE_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lines) {
      cart { ...CartFragment }
      userErrors { field message }
    }
  }
`