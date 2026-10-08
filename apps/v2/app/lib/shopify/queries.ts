// GraphQL queries for the Shopify Storefront API.
// Ported from lib/Shopify/queries.ts — types and query strings are unchanged.

export type ProductsPageResponse = {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
    edges: Array<{
      cursor: string
      node: {
        id: string
        handle: string
        title: string
        createdAt: string
        availableForSale: boolean
        productType: string
        tags: string[]
        featuredImage: null | { url: string; altText: string | null; width: number; height: number }
        variants: {
          edges: Array<{
            node: { id: string; availableForSale: boolean; price: { amount: string; currencyCode: string } }
          }>
        }
        metafield: null | { value: string | null }
      }
    }>
  }
}

export type ProductDetailResponse = {
  product: {
    id: string
    handle: string
    title: string
    createdAt: string
    description: string
    descriptionHtml: string
    productType: string
    tags: string[]
    availableForSale: boolean
    featuredImage: null | { url: string; altText: string | null; width: number; height: number }
    images: {
      edges: Array<{ node: { url: string; altText: string | null; width: number; height: number } }>
    }
    variants: {
      edges: Array<{
        node: {
          id: string
          title: string
          availableForSale: boolean
          selectedOptions: { name: string; value: string }
          price: { amount: string; currencyCode: string }
        }
      }>
    }
    audioPreviewMetafield: null | { value: string | null }
    whatsIncludedMetafield: null | { value: string | null }
  }
}

export const PRODUCTS_PAGE_QUERY = `
  query ProductsPage($first: Int!, $after: String, $sortKey: ProductSortKeys, $sortOrder: Boolean, $query: String) {
    products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $sortOrder) {
      pageInfo { hasNextPage endCursor }
      edges {
        cursor
        node {
          id handle title createdAt availableForSale productType tags
          featuredImage { url altText width height }
          variants(first: 1) {
            edges { node { id availableForSale price { amount currencyCode } } }
          }
          metafield(namespace: "custom", key: "audio_preview_urls") { value }
        }
      }
    }
  }
`

export const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      id handle title createdAt description descriptionHtml productType tags availableForSale
      featuredImage { url altText width height }
      images(first: 10) { edges { node { url altText width height } } }
      variants(first: 1) {
        edges {
          node {
            id title availableForSale
            selectedOptions { name value }
            price { amount currencyCode }
          }
        }
      }
      audioPreviewMetafield: metafield(namespace: "custom", key: "audio_preview_urls") { value }
      whatsIncludedMetafield: metafield(namespace: "custom", key: "whats_included") { value }
    }
  }
`
