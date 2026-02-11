import { createStorefrontApiClient } from '@shopify/storefront-api-client';
import { fetchShopify } from './fetch-shopify';

export const shopifyServerClient = (apiEndpoint?: string) => createStorefrontApiClient({
  storeDomain: apiEndpoint || process.env.SHOPIFY_DEV_STORE_DOMAIN!,
  apiVersion: process.env.SHOPIFY_STOREFRONT_API_VERSION || '2026-01',
  privateAccessToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
  customFetchApi: (endpoint, init) => fetchShopify({ init, apiEndpoint: endpoint }),
});