import { createStorefrontApiClient } from '@shopify/storefront-api-client'

// Server-only — only called inside createServerFn handlers, never on the client.
// Env vars are NOT VITE_ prefixed intentionally: Vite exposes them to process.env
// on the server side but never to the client bundle.
export function createShopifyClient() {
  const isDev = process.env.NODE_ENV === 'development'

  return createStorefrontApiClient({
    storeDomain: isDev
      ? process.env.SHOPIFY_DEV_STORE_DOMAIN!
      : process.env.SHOPIFY_PROD_STORE_DOMAIN!,
    apiVersion: process.env.SHOPIFY_STOREFRONT_API_VERSION ?? '2026-01',
    privateAccessToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
  })
}
