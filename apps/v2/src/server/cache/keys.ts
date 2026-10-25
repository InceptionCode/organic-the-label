// Cache key contract (00-architecture section 7). apps/api busts product:handle:<h>,
// shopify:products:*, compositions:* and free-resources:* on webhooks, so keep these shapes exact.
export const keys = {
  productByHandle: (h: string) => `product:handle:${h}`,
  productList: (sig: string) => `shopify:products:list:${sig}`,
  productsNewest: (n: number) => `shopify:products:newest:${n}`,
  productsSitemap: () => 'shopify:products:sitemap',
  productSearch: (q: string) => `shopify:products:search:${q.toLowerCase()}`,
  compositionsList: () => 'compositions:list',
  compositionBySlug: (s: string) => `compositions:slug:${s}`,
  compositionsSitemap: () => 'compositions:sitemap',
  freeResourcesList: () => 'free-resources:list',
  freeResourceBySlug: (s: string) => `free-resources:slug:${s}`,
  freeResourcesSitemap: () => 'free-resources:sitemap',
} as const

// Seconds. Webhook busting keeps long TTLs safe.
export const ttl = {
  product: 3600,
  productList: 3600,
  productsNewest: 3600,
  productsSitemap: 3600,
  productSearch: 300,
  compositions: 3600,
  freeResources: 3600,
} as const
