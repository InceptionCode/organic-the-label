import { z } from 'zod'
import { CDN_TAG } from '~/server/http/cache-headers'
import { purgeJson, readSignedBody, type SignedRequestDeps } from '~/server/cache/purge'

// POST /api/cache/flush (phase 08.0). Run by apps/v2/scripts/flush-caches.ts after a deployment (the
// post-deploy-flush GitHub workflow) or by hand: deletes every v2 Redis namespace, then invalidates
// every CDN tag family, so a release that changes a cached value's shape never serves the old shape.
// Same auth as /api/cache/purge (readSignedBody: HMAC of `${timestamp}.${rawBody}`, 5 min window),
// and src/start.ts exempts this exact path from the CSRF check for the same reason.
//
// Framework-free: unit tests drive it with a plain Request, a fake Redis and a fake invalidate.

const TAG = '[api/cache/flush]'

export const CACHE_FLUSH_PATH = '/api/cache/flush'

/** Every Redis key family v2 writes (src/server/cache/keys.ts). Keep in sync with that file. */
export const FLUSH_PATTERNS = ['product:*', 'shopify:products:*', 'compositions:*', 'free-resources:*', 'work-with-me:*'] as const

/** Every CDN tag family (CDN_TAG). Per-product tags are covered by `products`, which every page carries. */
export const FLUSH_TAGS: string[] = [CDN_TAG.products, CDN_TAG.compositions, CDN_TAG.freeResources]

/** SCAN page size hint and DEL batch size. */
export const FLUSH_BATCH = 500
/** Hard stop for one pattern's SCAN loop, far above any realistic key count at this traffic. */
const MAX_SCAN_PAGES = 10_000

/** The two Upstash calls the flush needs; the real client and test fakes both satisfy it. */
export type FlushStore = {
  scan(cursor: string | number, opts: { match: string; count: number }): Promise<[string, string[]]>
  del(...keys: string[]): Promise<number>
}

/** Body: `{}` or `{ "scope": "all" }` (an empty body is treated as `{}`). */
export const flushBodySchema = z.object({ scope: z.literal('all').optional() }).strict()

/** Deletes every key matching `pattern` with SCAN + DEL in batches. Returns the number deleted. */
export async function deleteByPattern(store: FlushStore, pattern: string, batch = FLUSH_BATCH): Promise<number> {
  let cursor = '0'
  let deleted = 0
  for (let page = 0; page < MAX_SCAN_PAGES; page++) {
    const [next, keys] = await store.scan(cursor, { match: pattern, count: batch })
    for (let i = 0; i < keys.length; i += batch) {
      const chunk = keys.slice(i, i + batch)
      if (chunk.length > 0) deleted += await store.del(...chunk)
    }
    cursor = String(next)
    if (cursor === '0') return deleted
  }
  throw new Error(`SCAN for ${pattern} did not finish after ${MAX_SCAN_PAGES} pages`)
}

export type FlushDeps = SignedRequestDeps & {
  /** Upstash client; null when UPSTASH_REDIS_REST_URL / _TOKEN are unset (503). */
  redis: FlushStore | null
  /** False outside a Vercel Function (local dev): invalidateByTag would be a silent no-op. */
  available: () => boolean
  invalidate: (tags: string[]) => Promise<void>
}

/** Verifies the signature, flushes Redis, then invalidates every CDN tag. Answers JSON counts. */
export async function handleFlushRequest(request: Request, deps: FlushDeps): Promise<Response> {
  const signed = await readSignedBody(request, deps, TAG)
  if (signed instanceof Response) return signed

  try {
    const parsed = flushBodySchema.safeParse(signed.rawBody.trim() === '' ? {} : JSON.parse(signed.rawBody))
    if (!parsed.success) return purgeJson(400, { ok: false, error: 'Invalid body.' })
  } catch {
    return purgeJson(400, { ok: false, error: 'Invalid JSON.' })
  }

  if (!deps.redis) {
    console.warn(TAG, 'Redis is not configured')
    return purgeJson(503, { ok: false, error: 'Redis is not configured.' })
  }

  const redis: Record<string, number> = {}
  try {
    for (const pattern of FLUSH_PATTERNS) redis[pattern] = await deleteByPattern(deps.redis, pattern)
  } catch (error) {
    console.error(TAG, 'Redis flush failed', error instanceof Error ? error.message : error, { deleted: redis })
    return purgeJson(500, { ok: false, error: 'Redis flush failed.' })
  }
  const deletedTotal = Object.values(redis).reduce((sum, n) => sum + n, 0)
  console.info(TAG, 'redis flushed', { redis, deletedTotal })

  if (!deps.available()) {
    console.warn(TAG, 'CDN purge API unavailable outside a Vercel Function')
    return purgeJson(503, { ok: false, error: 'CDN purge is unavailable on this runtime.', redis, deletedTotal })
  }
  try {
    await deps.invalidate(FLUSH_TAGS)
  } catch (error) {
    console.error(TAG, 'invalidateByTag failed', error instanceof Error ? error.message : error)
    return purgeJson(502, { ok: false, error: 'Invalidation failed.', redis, deletedTotal })
  }
  console.info(TAG, 'invalidated', { tags: FLUSH_TAGS })
  return purgeJson(200, { ok: true, redis, deletedTotal, invalidated: FLUSH_TAGS })
}
