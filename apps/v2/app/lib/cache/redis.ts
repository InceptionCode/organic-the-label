import { Redis } from '@upstash/redis'

// Lazy singleton — safe to import at module scope in server functions.
// Only initialised when first accessed, so missing env vars only throw
// at the point of use (not on import).
let _redis: Redis | null = null

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return _redis
}

// Typed read-through cache.  Fetcher runs only on cache miss.
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 900,
): Promise<T> {
  const redis = getRedis()
  const hit = await redis.get<T>(key)
  if (hit !== null && hit !== undefined) return hit

  const fresh = await fetcher()
  await redis.set(key, fresh, { ex: ttl })
  return fresh
}

// Delete a single key — called by Hono webhooks after Shopify/Supabase events.
export async function invalidateKey(key: string): Promise<void> {
  await getRedis().del(key)
}

// SCAN + DEL for wildcard patterns, e.g. `shopify:products:*`.
export async function invalidatePattern(pattern: string): Promise<void> {
  const redis = getRedis()
  let cursor = 0
  do {
    const [next, keys] = await redis.scan(cursor, { match: pattern })
    cursor = Number(next)
    if (keys.length > 0) await redis.del(...(keys as [string, ...string[]]))
  } while (cursor !== 0)
}
