import { createStorefrontApiClient } from '@shopify/storefront-api-client';

export const shopifyClient = (apiEndpoint?: string) => createStorefrontApiClient({
  storeDomain: apiEndpoint || process.env.SHOPIFY_DEV_STORE_DOMAIN!,
  apiVersion: process.env.SHOPIFY_STOREFRONT_API_VERSION || '2026-01',
  publicAccessToken: process.env.SHOPIFY_PUBLIC_ACCESS_TOKEN,
});