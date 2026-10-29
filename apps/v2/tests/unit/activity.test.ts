import { describe, expect, test } from 'bun:test'
import { recordEvents, type RecordEventsInput } from '~/server/activity/record'
import { MAX_PROPERTIES_BYTES, trackBatchSchema } from '~/server/activity/schema'
import { handleTrackRequest, isSameOriginRequest, type TrackDeps } from '~/server/activity/track-request'
import type { EnsureVisitorInput } from '~/server/identity/visitor'
import { fakeSupabase } from './fake-supabase'

const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
const ORIGIN = 'https://example.test'

const event = (eventType: string, eventProperties?: unknown) => ({ eventType, eventProperties })

describe('trackBatchSchema', () => {
  test('accepts every client event, including the three v2-only ones, and defaults properties', () => {
    const parsed = trackBatchSchema.parse({
      events: [
        event('homepage_viewed'),
        event('preview_playlist_completed', { handle: 'kit', productId: 'gid://shopify/Product/1', trackCount: 8 }),
        event('access_requested', { productId: 'gid://shopify/Product/1', handle: 'kit', surface: 'library' }),
        event('search_filter_changed', { type: 'products', query: 'drums' }),
      ],
    })
    expect(parsed.events).toHaveLength(4)
    expect(parsed.events[0]!.eventProperties).toEqual({})
  })

  test('rejects an unknown or server-only event type', () => {
    expect(trackBatchSchema.safeParse({ events: [event('page_hacked')] }).success).toBe(false)
    expect(trackBatchSchema.safeParse({ events: [event('resource_downloaded')] }).success).toBe(false)
  })

  test('rejects a property bag over 2 KB', () => {
    const big = { blob: 'x'.repeat(MAX_PROPERTIES_BYTES) }
    expect(trackBatchSchema.safeParse({ events: [event('product_viewed', big)] }).success).toBe(false)
    const fits = { blob: 'x'.repeat(MAX_PROPERTIES_BYTES - 20) }
    expect(trackBatchSchema.safeParse({ events: [event('product_viewed', fits)] }).success).toBe(true)
  })

  test('rejects an empty batch and a batch of 21', () => {
    expect(trackBatchSchema.safeParse({ events: [] }).success).toBe(false)
    expect(trackBatchSchema.safeParse({ events: Array.from({ length: 20 }, () => event('store_viewed')) }).success).toBe(true)
    expect(trackBatchSchema.safeParse({ events: Array.from({ length: 21 }, () => event('store_viewed')) }).success).toBe(false)
  })
})

describe('recordEvents', () => {
  const events = [{ eventType: 'store_viewed' as const, eventProperties: { path: '/store' } }]

  test('throws without a database call when both ids are null', async () => {
    const { client, calls } = fakeSupabase()
    await expect(recordEvents({ userId: null, anonymousVisitorId: null, events }, client)).rejects.toThrow()
    expect(calls).toHaveLength(0)
  })

  test('a signed-in batch inserts user rows with a null visitor id', async () => {
    const { client, calls } = fakeSupabase()
    await recordEvents({ userId: 'u1', anonymousVisitorId: 'v1', events: [...events, { eventType: 'cart_opened', eventProperties: {} }] }, client)
    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({ table: 'activity_events', op: 'insert' })
    expect(calls[0]!.payload).toEqual([
      { user_id: 'u1', anonymous_visitor_id: null, event_type: 'store_viewed', event_properties: { path: '/store' } },
      { user_id: 'u1', anonymous_visitor_id: null, event_type: 'cart_opened', event_properties: {} },
    ])
  })

  test('an anonymous batch inserts visitor rows', async () => {
    const { client, calls } = fakeSupabase()
    await recordEvents({ userId: null, anonymousVisitorId: 'v1', events }, client)
    expect(calls[0]!.payload).toEqual([{ user_id: null, anonymous_visitor_id: 'v1', event_type: 'store_viewed', event_properties: { path: '/store' } }])
  })

  test('surfaces a database error as a thrown error', async () => {
    const { client } = fakeSupabase(() => ({ data: null, error: { message: 'boom' } }))
    await expect(recordEvents({ userId: 'u1', anonymousVisitorId: null, events }, client)).rejects.toThrow('boom')
  })
})

describe('isSameOriginRequest', () => {
  const req = (headers: Record<string, string>) => new Request(`${ORIGIN}/api/track`, { method: 'POST', headers })
  test('follows Sec-Fetch-Site first, then Origin, and rejects requests with neither', () => {
    expect(isSameOriginRequest(req({ 'sec-fetch-site': 'same-origin' }))).toBe(true)
    expect(isSameOriginRequest(req({ 'sec-fetch-site': 'cross-site', origin: ORIGIN }))).toBe(false)
    expect(isSameOriginRequest(req({ 'sec-fetch-site': 'same-site' }))).toBe(false)
    expect(isSameOriginRequest(req({ origin: ORIGIN }))).toBe(true)
    expect(isSameOriginRequest(req({ origin: 'https://evil.test' }))).toBe(false)
    expect(isSameOriginRequest(req({ referer: `${ORIGIN}/store` }))).toBe(false)
  })
})

describe('handleTrackRequest', () => {
  function setup(userId: string | null = null) {
    const recorded: RecordEventsInput[] = []
    const visitorCalls: EnsureVisitorInput[] = []
    const deps: TrackDeps = {
      userId,
      ensureVisitor: async (input) => {
        visitorCalls.push(input)
        input.setCookie('anon_token', 'tok', { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 10 })
        return { id: 'visitor-1' }
      },
      recordEvents: async (input) => void recorded.push(input),
    }
    return { deps, recorded, visitorCalls }
  }
  const post = (body: unknown, headers: Record<string, string> = {}) =>
    new Request(`${ORIGIN}/api/track`, {
      method: 'POST',
      headers: { origin: ORIGIN, 'user-agent': BROWSER_UA, 'content-type': 'application/json', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
  const batch = (n: number) => ({ events: Array.from({ length: n }, () => event('product_viewed', { handle: 'kit' })) })

  test('a foreign origin is 403 and writes nothing', async () => {
    const { deps, recorded, visitorCalls } = setup()
    const res = await handleTrackRequest(post(batch(1), { origin: 'https://evil.test' }), deps)
    expect(res.status).toBe(403)
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(res.headers.get('x-robots-tag')).toBe('noindex')
    expect(recorded).toHaveLength(0)
    expect(visitorCalls).toHaveLength(0)
  })

  test('a bot is 204 with no visitor and no insert', async () => {
    const { deps, recorded, visitorCalls } = setup()
    const res = await handleTrackRequest(post(batch(2), { 'user-agent': GOOGLEBOT }), deps)
    expect(res.status).toBe(204)
    expect(recorded).toHaveLength(0)
    expect(visitorCalls).toHaveLength(0)
  })

  test('an invalid body is 400', async () => {
    const { deps, recorded } = setup()
    for (const body of ['not json', { events: [] }, batch(21), { events: [event('nope')] }]) {
      const res = await handleTrackRequest(post(body), deps)
      expect(res.status).toBe(400)
    }
    expect(recorded).toHaveLength(0)
  })

  test('an anonymous valid batch creates the visitor lazily, inserts N rows, and sets the cookie', async () => {
    const { deps, recorded, visitorCalls } = setup()
    const res = await handleTrackRequest(post(batch(3)), deps)
    expect(res.status).toBe(204)
    expect(visitorCalls).toHaveLength(1)
    expect(recorded).toHaveLength(1)
    expect(recorded[0]).toMatchObject({ userId: null, anonymousVisitorId: 'visitor-1' })
    expect(recorded[0]!.events).toHaveLength(3)
    expect(res.headers.get('set-cookie')).toContain('anon_token=tok')
  })

  test('a signed-in batch never creates a visitor', async () => {
    const { deps, recorded, visitorCalls } = setup('user-1')
    const res = await handleTrackRequest(post(batch(2)), deps)
    expect(res.status).toBe(204)
    expect(visitorCalls).toHaveLength(0)
    expect(recorded[0]).toMatchObject({ userId: 'user-1', anonymousVisitorId: null })
  })

  test('a database failure is a bare 500 that leaks nothing', async () => {
    const { deps } = setup('user-1')
    const original = console.error
    console.error = () => {}
    try {
      const res = await handleTrackRequest(post(batch(1)), { ...deps, recordEvents: async () => Promise.reject(new Error('secret db detail')) })
      expect(res.status).toBe(500)
      expect(await res.text()).toBe('')
    } finally {
      console.error = original
    }
  })
})
