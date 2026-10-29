// Anonymous CDN caching (phase 07.3, 00-architecture section 7). Public, data-driven pages send
// PUBLIC_PAGE_CACHE_CONTROL from their route `headers()`; the cache-guard request middleware then
// downgrades any response that could carry per-visitor state to PRIVATE_NO_STORE.
//
// Why this is safe: the Vercel cache key ignores cookies, so a signed-in visitor can be served the cached
// anonymous HTML. That HTML holds no user data (session is null, the cart and owned badges load on the
// client), and <AuthSync/> reconciles ['session'] on INITIAL_SESSION after hydration.
//
// Pure (no server imports) so the decision is unit tested directly.

export const PUBLIC_PAGE_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=600'
export const PRIVATE_NO_STORE = 'private, no-store'

// Vercel CDN cache tags (phase 07.8, 00-architecture section 7). One tag per Redis key family that
// apps/api busts on webhooks; apps/api then POSTs the same tags to /api/cache/purge, which calls
// invalidateByTag. The purge allow-list (server/cache/purge.ts) accepts exactly these shapes. Every
// public page carries `products`: the root loader dehydrates productQueries.newest(5) for the sticky bar.
export const CDN_TAG = { products: 'products', compositions: 'compositions', freeResources: 'free-resources' } as const
export type CdnTag = (typeof CDN_TAG)[keyof typeof CDN_TAG] | `product:${string}`

/** Shopify handles are lowercase ASCII and hyphens; anything else gets no per-product tag (`products` still covers it). */
export const PRODUCT_HANDLE_TAG = /^[a-z0-9][a-z0-9-]{0,199}$/
export const productTag = (handle: string): CdnTag[] => (PRODUCT_HANDLE_TAG.test(handle) ? [`product:${handle}`] : [])

/** Route `headers()` for public, anonymous-safe pages, tagged with every data family the HTML renders. */
export const publicPageHeaders = (tags: readonly CdnTag[]) => ({
  'Cache-Control': PUBLIC_PAGE_CACHE_CONTROL,
  'Vercel-Cache-Tag': tags.join(','),
})

/** Paths that never get a shared cache, whatever a handler set: auth, account, search, APIs, downloads, server fns. */
const NEVER_PUBLIC = [
  /^\/api(\/|$)/,
  /^\/auth(\/|$)/,
  /^\/account(\/|$)/,
  /^\/login(\/|$)/,
  /^\/signup(\/|$)/,
  /^\/search(\/|$)/,
  /^\/free\/download(\/|$)/,
  /^\/compositions\/download(\/|$)/,
  /^\/_serverFn(\/|$)/,
]

/** True when a Cache-Control value lets a shared cache (the CDN) store the response. */
export function isSharedCacheable(cacheControl: string | null | undefined): boolean {
  if (!cacheControl) return false
  const value = cacheControl.toLowerCase()
  if (/\b(private|no-store)\b/.test(value)) return false
  return /\bpublic\b|\bs-maxage\s*=/.test(value)
}

/** Cookie names from a Cookie request header. */
export function cookieNames(cookieHeader: string | null | undefined): string[] {
  if (!cookieHeader) return []
  return cookieHeader
    .split(';')
    .map((part) => part.split('=')[0]?.trim() ?? '')
    .filter(Boolean)
}

export type CacheGuardInput = {
  method: string
  pathname: string
  status: number
  /** Names of the cookies the request carried. */
  requestCookies: string[]
  /** The response sets at least one cookie. */
  setsCookie: boolean
  /** The response's Cache-Control, if any. */
  cacheControl: string | null
}

/**
 * The Cache-Control the guard must force, or null to leave the response alone. Only responses that a
 * shared cache could store are touched; they become `private, no-store` when the request carries any
 * `sb-` (Supabase auth) cookie, the response sets a cookie, the method is not GET or HEAD, the status is
 * not 200, or the path is one that must never be shared.
 */
export function guardCacheControl(input: CacheGuardInput): string | null {
  if (!isSharedCacheable(input.cacheControl)) return null
  const method = input.method.toUpperCase()
  const unsafe =
    (method !== 'GET' && method !== 'HEAD') ||
    input.status !== 200 ||
    input.setsCookie ||
    input.requestCookies.some((name) => name.startsWith('sb-')) ||
    NEVER_PUBLIC.some((pattern) => pattern.test(input.pathname))
  return unsafe ? PRIVATE_NO_STORE : null
}
