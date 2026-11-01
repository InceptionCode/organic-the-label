import { describe, expect, mock, test } from 'bun:test'
import { FLUSH_PATTERNS, FLUSH_TAGS, deleteByPattern, handleFlushRequest, type FlushDeps, type FlushStore } from '~/server/cache/flush'
import { MAX_CLOCK_SKEW_SECONDS, PURGE_SIGNATURE_HEADER, PURGE_TIMESTAMP_HEADER, signPurge } from '~/server/cache/purge'
import { BYPASS_HEADER, buildFlushRequest, flushUrl, runFlush } from '../../scripts/flush-caches'

const SECRET = 'test-secret-0123456789abcdef0123456789abcdef'
const NOW = 1_800_000_000

/**
 * In-memory Redis with Upstash-shaped SCAN (string cursor, glob `prefix*` only) and DEL. Like real SCAN,
 * a scan started at cursor 0 still returns keys that existed then even if others are deleted meanwhile.
 */
function fakeRedis(keys: string[], pageSize = 2) {
  const store = new Set(keys)
  const delCalls: string[][] = []
  const snapshots = new Map<string, string[]>()
  const fake: FlushStore = {
    async scan(cursor, { match }) {
      const prefix = match.replace(/\*$/, '')
      if (String(cursor) === '0') snapshots.set(match, [...store].filter((k) => k.startsWith(prefix)).sort())
      const all = snapshots.get(match) ?? []
      const start = Number(cursor)
      const page = all.slice(start, start + pageSize)
      const next = start + pageSize >= all.length ? '0' : String(start + pageSize)
      return [next, page]
    },
    async del(...ks) {
      delCalls.push(ks)
      let n = 0
      for (const k of ks) if (store.delete(k)) n++
      return n
    },
  }
  return { fake, store, delCalls }
}

function signedRequest(body: string, opts: { secret?: string; timestamp?: number } = {}) {
  const timestamp = String(opts.timestamp ?? NOW)
  return new Request('https://example.test/api/cache/flush', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      [PURGE_TIMESTAMP_HEADER]: timestamp,
      [PURGE_SIGNATURE_HEADER]: signPurge(opts.secret ?? SECRET, timestamp, body),
    },
    body,
  })
}

const KEYS = [
  'product:handle:wave-pack',
  'product:handle:808s',
  'shopify:products:list:abc',
  'shopify:products:sitemap',
  'shopify:products:newest:5',
  'compositions:list',
  'compositions:slug:lofi',
  'free-resources:list',
  'work-with-me:spotify',
  'unrelated:key',
  'visitor:123',
]

function deps(overrides: Partial<FlushDeps> = {}) {
  const redis = fakeRedis(KEYS)
  const invalidate = mock(async (_tags: string[]) => {})
  const d: FlushDeps = { secret: SECRET, redis: redis.fake, available: () => true, invalidate, now: () => NOW, ...overrides }
  return { redis, invalidate, deps: d }
}

describe('deleteByPattern', () => {
  test('walks every SCAN page and deletes in batches', async () => {
    const { fake, store, delCalls } = fakeRedis(KEYS, 2)
    expect(await deleteByPattern(fake, 'shopify:products:*', 2)).toBe(3)
    expect([...store].some((k) => k.startsWith('shopify:products:'))).toBe(false)
    expect(delCalls.every((c) => c.length <= 2)).toBe(true)
  })

  test('splits a SCAN page larger than the batch size', async () => {
    const { fake, delCalls } = fakeRedis(KEYS, 50)
    expect(await deleteByPattern(fake, 'shopify:products:*', 2)).toBe(3)
    expect(delCalls.map((c) => c.length)).toEqual([2, 1])
  })

  test('no DEL call when nothing matches', async () => {
    const { fake, delCalls } = fakeRedis(KEYS)
    expect(await deleteByPattern(fake, 'nothing:*')).toBe(0)
    expect(delCalls).toEqual([])
  })
})

describe('handleFlushRequest', () => {
  test('deletes every v2 namespace, keeps other keys, invalidates every tag family', async () => {
    const { redis, invalidate, deps: d } = deps()
    const res = await handleFlushRequest(signedRequest('{"scope":"all"}'), d)
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect(body).toEqual({
      ok: true,
      redis: { 'product:*': 2, 'shopify:products:*': 3, 'compositions:*': 2, 'free-resources:*': 1, 'work-with-me:*': 1 },
      deletedTotal: 9,
      invalidated: ['products', 'compositions', 'free-resources'],
    })
    expect(Object.keys(body.redis as object)).toEqual([...FLUSH_PATTERNS])
    expect([...redis.store].sort()).toEqual(['unrelated:key', 'visitor:123'])
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(invalidate.mock.calls[0]?.[0]).toEqual(FLUSH_TAGS)
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(res.headers.get('x-robots-tag')).toBe('noindex')
  })

  test('accepts {} and an empty body', async () => {
    for (const body of ['{}', '']) expect((await handleFlushRequest(signedRequest(body), deps().deps)).status).toBe(200)
  })

  test('401 for a wrong secret, a stale timestamp or no signature; nothing deleted', async () => {
    const { redis, invalidate, deps: d } = deps()
    const cases = [
      signedRequest('{}', { secret: 'wrong-secret' }),
      signedRequest('{}', { timestamp: NOW - MAX_CLOCK_SKEW_SECONDS - 60 }),
      new Request('https://example.test/api/cache/flush', { method: 'POST', body: '{}' }),
    ]
    for (const req of cases) {
      const res = await handleFlushRequest(req, d)
      expect(res.status).toBe(401)
      expect(await res.text()).not.toContain(SECRET)
    }
    expect(redis.store.size).toBe(KEYS.length)
    expect(invalidate).not.toHaveBeenCalled()
  })

  test('503 when the secret is unset', async () => {
    expect((await handleFlushRequest(signedRequest('{}'), deps({ secret: undefined }).deps)).status).toBe(503)
  })

  test('400 for an unknown body shape or bad JSON, even when signed', async () => {
    const { redis, deps: d } = deps()
    for (const body of ['{"scope":"products"}', '{"tags":["products"]}', 'not json', '[]']) {
      expect((await handleFlushRequest(signedRequest(body), d)).status).toBe(400)
    }
    expect(redis.store.size).toBe(KEYS.length)
  })

  test('503 when Redis is not configured', async () => {
    const { invalidate, deps: d } = deps({ redis: null })
    expect((await handleFlushRequest(signedRequest('{}'), d)).status).toBe(503)
    expect(invalidate).not.toHaveBeenCalled()
  })

  test('500 without details when Redis fails; CDN untouched', async () => {
    const failing: FlushStore = {
      scan: async () => Promise.reject(new Error('ECONNRESET upstash token=abc')),
      del: async () => 0,
    }
    const { invalidate, deps: d } = deps({ redis: failing })
    const res = await handleFlushRequest(signedRequest('{}'), d)
    expect(res.status).toBe(500)
    const text = await res.text()
    expect(text).not.toContain('ECONNRESET')
    expect(text).not.toContain('token')
    expect(invalidate).not.toHaveBeenCalled()
  })

  test('503 off Vercel and 502 when invalidation throws, after Redis was flushed', async () => {
    const off = deps({ available: () => false })
    const res = await handleFlushRequest(signedRequest('{}'), off.deps)
    expect(res.status).toBe(503)
    expect(((await res.json()) as { deletedTotal: number }).deletedTotal).toBe(9)
    expect(off.invalidate).not.toHaveBeenCalled()

    const failing = deps({ invalidate: async () => Promise.reject(new Error('429')) })
    expect((await handleFlushRequest(signedRequest('{}'), failing.deps)).status).toBe(502)
  })
})

describe('scripts/flush-caches', () => {
  test('flushUrl keeps the origin only and refuses plain http off localhost', () => {
    expect(flushUrl('https://dev.example.test/some/path?x=1')).toBe('https://dev.example.test/api/cache/flush')
    expect(flushUrl('http://localhost:3001')).toBe('http://localhost:3001/api/cache/flush')
    for (const bad of [undefined, '', 'not a url', 'http://example.test', 'ftp://example.test']) expect(() => flushUrl(bad)).toThrow()
  })

  test('builds a request the endpoint accepts, with the bypass header only when set', async () => {
    const req = buildFlushRequest({ targetUrl: 'https://example.test', secret: SECRET, bypassSecret: 'bypass-value' }, NOW)
    expect(req.headers.get(BYPASS_HEADER)).toBe('bypass-value')
    expect((await handleFlushRequest(req, deps().deps)).status).toBe(200)

    const plain = buildFlushRequest({ targetUrl: 'https://example.test', secret: SECRET }, NOW)
    expect(plain.headers.get(BYPASS_HEADER)).toBeNull()
    expect(() => buildFlushRequest({ targetUrl: 'https://example.test', secret: undefined })).toThrow('CACHE_PURGE_SECRET')
  })

  test('runFlush returns the summary on 2xx and throws on failure without the secret', async () => {
    const ok = mock(async () => Response.json({ ok: true, deletedTotal: 3 }))
    expect(await runFlush({ targetUrl: 'https://example.test', secret: SECRET }, ok as unknown as typeof fetch)).toEqual({ ok: true, deletedTotal: 3 })

    const denied = mock(async () => new Response('<html>Authentication Required</html>', { status: 401 }))
    const error = await runFlush({ targetUrl: 'https://example.test', secret: SECRET }, denied as unknown as typeof fetch).catch((e: Error) => e)
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toContain('HTTP 401')
    expect((error as Error).message).not.toContain(SECRET)
  })
})
