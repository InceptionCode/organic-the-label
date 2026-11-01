import { describe, expect, mock, test } from 'bun:test'
import { createCache, type CacheStore } from '~/server/cache/redis'

function fakeRedis(initial: Record<string, unknown> = {}) {
  const store = new Map<string, unknown>(Object.entries(initial))
  const set = mock(async (key: string, value: unknown, _opts: { ex: number }) => {
    store.set(key, value)
    return 'OK'
  })
  const redis: CacheStore = {
    get: async <T>(key: string) => (store.has(key) ? (store.get(key) as T) : null),
    set,
  }
  return { redis, store, set }
}

const quietLogger = () => ({ warn: mock((_msg: string) => {}) })

describe('getCached', () => {
  test('a hit skips the fetcher', async () => {
    const { redis } = fakeRedis({ k: { v: 1 } })
    const { getCached } = createCache(redis, quietLogger())
    const fetcher = mock(async () => ({ v: 2 }))
    expect(await getCached('k', 60, fetcher)).toEqual({ v: 1 })
    expect(fetcher).not.toHaveBeenCalled()
  })

  test('a miss fetches and stores with the TTL', async () => {
    const { redis, set } = fakeRedis()
    const { getCached } = createCache(redis, quietLogger())
    expect(await getCached('k', 120, async () => ['a'])).toEqual(['a'])
    expect(set).toHaveBeenCalledWith('k', ['a'], { ex: 120 })
  })

  test('empty and null results are not stored', async () => {
    const { redis, set } = fakeRedis()
    const { getCached } = createCache(redis, quietLogger())
    await getCached('a', 60, async () => [])
    await getCached('b', 60, async () => null)
    await getCached('c', 60, async () => undefined)
    expect(set).not.toHaveBeenCalled()
  })

  test('shouldCache overrides the default', async () => {
    const { redis, set } = fakeRedis()
    const { getCached } = createCache(redis, quietLogger())
    await getCached('k', 60, async () => ({ products: [] as string[] }), { shouldCache: (v) => v.products.length > 0 })
    expect(set).not.toHaveBeenCalled()
  })

  test('a throwing fetcher rethrows and stores nothing', async () => {
    const { redis, set } = fakeRedis()
    const { getCached } = createCache(redis, quietLogger())
    await expect(getCached('k', 60, async () => { throw new Error('upstream down') })).rejects.toThrow('upstream down')
    expect(set).not.toHaveBeenCalled()
  })

  test('a throwing Redis still returns fetcher data and logs once', async () => {
    const broken: CacheStore = {
      get: async () => { throw new Error('ECONNREFUSED') },
      set: async () => { throw new Error('ECONNREFUSED') },
    }
    const logger = quietLogger()
    const { getCached } = createCache(broken, logger)
    expect(await getCached('k', 60, async () => 'fresh')).toBe('fresh')
    expect(await getCached('k', 60, async () => 'again')).toBe('again')
    expect(logger.warn).toHaveBeenCalledTimes(1)
  })

  test('a failing write still returns the value', async () => {
    const redis: CacheStore = { get: async () => null, set: async () => { throw new Error('write failed') } }
    const logger = quietLogger()
    const { getCached } = createCache(redis, logger)
    expect(await getCached('k', 60, async () => 'v')).toBe('v')
    expect(logger.warn).toHaveBeenCalledTimes(1)
  })

  test('unconfigured Redis falls through to the fetcher and logs once', async () => {
    const logger = quietLogger()
    const { getCached } = createCache(null, logger)
    expect(await getCached('k', 60, async () => 1)).toBe(1)
    expect(await getCached('k', 60, async () => 2)).toBe(2)
    expect(logger.warn).toHaveBeenCalledTimes(1)
    expect(String(logger.warn.mock.calls[0]?.[0])).toContain('UPSTASH_REDIS_REST_URL')
  })
})
