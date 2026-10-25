// Storefront GraphQL documents and their raw result types. Field selections are ported from v1
// lib/Shopify/queries.ts and lib/Shopify/mutations.ts.

export type RawMoney = { amount: string; currencyCode: string }
export type RawImage = { url: string; altText: string | null; width: number | null; height: number | null }
type Edges<T> = { edges: { node: T }[] }
type RawPageInfo = { hasNextPage: boolean; endCursor: string | null }

const PRODUCT_SUMMARY_FIELDS = `
  id
  handle
  title
  createdAt
  availableForSale
  productType
  tags
  featuredImage { url altText width height }
  variants(first: 1) {
    edges { node { id availableForSale price { amount currencyCode } } }
  }
  audioPreviewMetafield: metafield(namespace: "custom", key: "audio_preview_urls") { value }
`

export type RawProductSummary = {
  id: string
  handle: string
  title: string
  createdAt: string
  availableForSale: boolean
  productType: string
  tags: string[]
  featuredImage: RawImage | null
  variants: Edges<{ id: string; availableForSale: boolean; price: RawMoney }>
  audioPreviewMetafield: { value: string | null } | null
}

export type RawProduct = RawProductSummary & {
  description: string
  descriptionHtml: string
  images: Edges<RawImage>
  whatsIncludedMetafield: { value: string | null } | null
}

export const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      ${PRODUCT_SUMMARY_FIELDS}
      description
      descriptionHtml
      images(first: 10) { edges { node { url altText width height } } }
      whatsIncludedMetafield: metafield(namespace: "custom", key: "whats_included") { value }
    }
  }
`
export type ProductByHandleVars = { handle: string }
export type ProductByHandleData = { product: RawProduct | null }

export const PRODUCTS_LIST_QUERY = `
  query ProductsList($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean) {
    products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
      pageInfo { hasNextPage endCursor }
      edges { node { ${PRODUCT_SUMMARY_FIELDS} } }
    }
  }
`
export type ProductSortKey = 'CREATED_AT' | 'PRICE' | 'TITLE' | 'RELEVANCE' | 'BEST_SELLING'
export type ProductsListVars = {
  first: number
  after?: string | null
  query?: string | null
  sortKey?: ProductSortKey
  reverse?: boolean
}
export type ProductsListData = { products: Edges<RawProductSummary> & { pageInfo: RawPageInfo } }

export const PRODUCT_HANDLES_QUERY = `
  query ProductHandles($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      edges { node { handle updatedAt } }
    }
  }
`
export type ProductHandlesVars = { first: number; after?: string | null }
export type ProductHandlesData = {
  products: Edges<{ handle: string; updatedAt: string }> & { pageInfo: RawPageInfo }
}

const CART_FRAGMENT = `
  fragment CartFragment on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount { amount currencyCode }
      totalAmount { amount currencyCode }
    }
    lines(first: 50) {
      edges {
        node {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              id
              title
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

export type RawCart = {
  id: string
  checkoutUrl: string
  totalQuantity: number
  cost: { subtotalAmount: RawMoney; totalAmount: RawMoney }
  lines: Edges<{
    id: string
    quantity: number
    merchandise: {
      id: string
      title: string
      product: { handle: string; title: string }
      image: RawImage | null
      price: RawMoney
    }
  }>
}

export type RawCartUserError = { field: string[] | null; message: string; code?: string | null }
type CartMutationPayload = { cart: RawCart | null; userErrors: RawCartUserError[] }

export const CART_QUERY = `
  ${CART_FRAGMENT}
  query Cart($id: ID!) {
    cart(id: $id) { ...CartFragment }
  }
`
export type CartVars = { id: string }
export type CartData = { cart: RawCart | null }

export const CART_CREATE_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartCreate($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) {
      cart { ...CartFragment }
      userErrors { field message code }
    }
  }
`
export type CartCreateVars = { lines: { merchandiseId: string; quantity: number }[] }
export type CartCreateData = { cartCreate: CartMutationPayload }

export const CART_LINES_ADD_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...CartFragment }
      userErrors { field message code }
    }
  }
`
export type CartLinesAddVars = { cartId: string; lines: { merchandiseId: string; quantity: number }[] }
export type CartLinesAddData = { cartLinesAdd: CartMutationPayload }

export const CART_LINES_UPDATE_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ...CartFragment }
      userErrors { field message code }
    }
  }
`
export type CartLinesUpdateVars = { cartId: string; lines: { id: string; quantity: number }[] }
export type CartLinesUpdateData = { cartLinesUpdate: CartMutationPayload }

export const CART_LINES_REMOVE_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ...CartFragment }
      userErrors { field message code }
    }
  }
`
export type CartLinesRemoveVars = { cartId: string; lineIds: string[] }
export type CartLinesRemoveData = { cartLinesRemove: CartMutationPayload }
