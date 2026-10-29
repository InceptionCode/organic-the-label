// Cache key contract (00-architecture section 7). apps/api busts product:handle:<h>,
// shopify:products:*, compositions:* and free-resources:* on webhooks, so keep these shapes exact.
export const keys = {
  productByHandle: (h: string) => `product:handle:${h}`,
  productList: (sig: string) => `shopify:products:list:${sig}`,
  productsNewest: (n: number) => `shopify:products:newest:${n}`,
  productsSitemap: () => 'shopify:products:sitemap',
  productSearch: (q: string) => `shopify:products:search:${q.toLowerCase()}`,
  /** Account library: products for a set of entitlement GIDs, keyed by a hash of the sorted ids. */
  productsByIds: (hash: string) => `shopify:products:nodes:${hash}`,
  compositionsList: () => 'compositions:list',
  compositionBySlug: (s: string) => `compositions:slug:${s}`,
  compositionsSitemap: () => 'compositions:sitemap',
  compositionsRecent: (n: number) => `compositions:recent:${n}`,
  compositionsSearch: (normalizedQ: string) => `compositions:search:${normalizedQ}`,
  freeResourcesList: () => 'free-resources:list',
  freeResourceBySlug: (s: string) => `free-resources:slug:${s}`,
  freeResourcesSitemap: () => 'free-resources:sitemap',
  /** Work With Me (pages/work-with-me.md): TTL only, not part of the apps/api busting contract. */
  workWithMeSpotify: () => 'work-with-me:spotify',
  workWithMeYoutube: () => 'work-with-me:youtube',
  workWithMeInstagram: () => 'work-with-me:instagram',
  /** /compositions list (pages/compositions.md): `range=..|sort=..|tags=..|search=..`. */
  compositionsListBy: (sig: string) => `compositions:list:${sig}`,
  /** /free: the featured row, else the starter kit (pages/free.md). */
  freeResourceFeatured: () => 'free-resources:featured',
} as const

// Seconds. Webhook busting keeps long TTLs safe. product and productList match v1
// (products-details-cache 30 days, products-cache 900s; pages/product.md, pages/store.md).
export const ttl = {
  product: 60 * 60 * 24 * 30,
  productList: 900,
  productsNewest: 3600,
  productsSitemap: 3600,
  productSearch: 300,
  productsByIds: 3600,
  compositions: 3600,
  /** pages/search.md: search results are short-lived. */
  search: 300,
  freeResources: 3600,
  /** Instagram thumbnails are signed URLs that expire within hours; do not raise this. */
  workWithMe: 3600,
  /** v1 compositions-cache revalidate (pages/compositions.md). */
  compositionsList: 900,
  /** v1 get-free-resource revalidate (pages/free.md). */
  freeResource: 300,
} as const
