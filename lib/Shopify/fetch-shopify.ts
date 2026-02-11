interface CustomRequestInit {
  method?: string;
  headers?: HeadersInit;
  body?: string;
  signal?: AbortSignal;
  keepalive?: boolean;
}

export async function fetchShopify({ apiEndpoint, init }: { init: CustomRequestInit | undefined, apiEndpoint?: string }) {
  if (!apiEndpoint || !init?.headers || !init?.body) {
    throw new Error("Missing Shopify env vars (SHOPIFY_STORE_DOMAIN / SHOPIFY_STOREFRONT_ACCESS_TOKEN). Request requires vars, headers and body");
  }

  const result = await fetch(apiEndpoint, {
    method: 'POST',
    ...init
  });

  return result;
}