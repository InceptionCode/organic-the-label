import { Redis } from '@upstash/redis'
import { env } from '~/server/env'

// The subset of the Upstash client getCached uses, so tests can pass a fake.
export type CacheStore = {
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown, opts: { ex: number }): Promise<unknown>
}

export type GetCachedOptions<T> = { shouldCache?: (value: T) => boolean }

const defaultShouldCache = (value: unknown) =>
  value !== null && value !== undefined && !(Array.isArray(value) && value.length === 0)

export function createCache(redis: CacheStore | null, logger: Pick<Console, 'warn'> = console) {
  let warned = false
  const warnOnce = (message: string, error?: unknown) => {
    if (warned) return
    warned = true
    const detail = error instanceof Error ? `: ${error.message}` : ''
    logger.warn(`[cache] ${message}${detail}. Falling through to the source.`)
  }

  async function getCached<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>,
    opts: GetCachedOptions<T> = {},
  ): Promise<T> {
    if (!redis) {
      warnOnce('Redis is not configured (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)')
      return fetcher()
    }

    try {
      const hit = await redis.get<T>(key)
      if (hit !== null && hit !== undefined) return hit
    } catch (error) {
      warnOnce('Redis read failed', error)
      return fetcher()
    }

    const value = await fetcher()
    const shouldCache = opts.shouldCache ?? defaultShouldCache
    if (shouldCache(value)) {
      try {
        await redis.set(key, value, { ex: ttlSeconds })
      } catch (error) {
        warnOnce('Redis write failed', error)
      }
    }
    return value
  }

  return { getCached }
}

const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN })
    : null

export const { getCached } = createCache(redis)
