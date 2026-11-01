import { afterEach, beforeEach, describe, expect, jest, test } from 'bun:test'
import { createTracker, FLUSH_AFTER_MS, TRACK_ENDPOINT } from '~/lib/track'

type Listener = () => void

function fakeEnv({ beacon = true, webdriver = false } = {}) {
  const beacons: { url: string; body: Blob }[] = []
  const fetches: { url: string; init: RequestInit }[] = []
  const docListeners: Record<string, Listener[]> = {}
  const winListeners: Record<string, Listener[]> = {}
  let now = 0
  const doc = {
    visibilityState: 'visible' as DocumentVisibilityState,
    addEventListener: (type: string, fn: Listener) => void (docListeners[type] ??= []).push(fn),
  }
  const env = {
    navigator: {
      webdriver,
      sendBeacon: beacon ? (url: string | URL, body?: BodyInit | null) => (beacons.push({ url: String(url), body: body as Blob }), true) : (() => false),
    },
    document: doc,
    window: { addEventListener: (type: string, fn: Listener) => void (winListeners[type] ??= []).push(fn) },
    location: { pathname: '/' },
    fetch: (async (url: string, init: RequestInit) => {
      fetches.push({ url, init })
      return new Response(null, { status: 204 })
    }) as unknown as typeof fetch,
    now: () => now,
  }
  return {
    env: env as unknown as Parameters<typeof createTracker>[0],
    beacons,
    fetches,
    location: env.location,
    advanceClock: (ms: number) => (now += ms),
    hide: () => {
      doc.visibilityState = 'hidden'
      for (const fn of docListeners.visibilitychange ?? []) fn()
    },
    pagehide: () => {
      for (const fn of winListeners.pagehide ?? []) fn()
    },
  }
}

const eventsIn = async (blob: Blob) => (JSON.parse(await blob.text()) as { events: { eventType: string }[] }).events

describe('client track queue', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  test('queues without a request, then sends one beacon with every event after 10 seconds', async () => {
    const f = fakeEnv()
    const { track } = createTracker(f.env)
    for (const path of ['/', '/store', '/store/a', '/store/b', '/explore']) {
      f.location.pathname = path
      f.advanceClock(2000)
      track('store_viewed')
    }
    expect(f.beacons).toHaveLength(0)
    jest.advanceTimersByTime(FLUSH_AFTER_MS - 1)
    expect(f.beacons).toHaveLength(0)
    jest.advanceTimersByTime(1)
    expect(f.beacons).toHaveLength(1)
    expect(f.beacons[0]!.url).toBe(TRACK_ENDPOINT)
    expect(f.beacons[0]!.body.type).toContain('application/json')
    expect(await eventsIn(f.beacons[0]!.body)).toHaveLength(5)
  })

  test('flushes at 20 events without waiting', async () => {
    const f = fakeEnv()
    const { track } = createTracker(f.env)
    for (let i = 0; i < 20; i++) track('audio_preview_played', { i })
    expect(f.beacons).toHaveLength(1)
    expect(await eventsIn(f.beacons[0]!.body)).toHaveLength(20)
    track('cart_opened')
    expect(f.beacons).toHaveLength(1)
  })

  test('flushes when the page is hidden or unloaded, and the timer does not send twice', () => {
    const f = fakeEnv()
    const { track } = createTracker(f.env)
    track('cart_opened')
    f.hide()
    expect(f.beacons).toHaveLength(1)
    jest.advanceTimersByTime(FLUSH_AFTER_MS)
    expect(f.beacons).toHaveLength(1)
    track('checkout_clicked')
    f.pagehide()
    expect(f.beacons).toHaveLength(2)
  })

  test('an empty queue sends nothing', () => {
    const f = fakeEnv()
    createTracker(f.env)
    f.pagehide()
    jest.advanceTimersByTime(FLUSH_AFTER_MS * 2)
    expect(f.beacons).toHaveLength(0)
  })

  test('falls back to a keepalive fetch when sendBeacon refuses', () => {
    const f = fakeEnv({ beacon: false })
    const { track } = createTracker(f.env)
    track('checkout_clicked')
    f.pagehide()
    expect(f.fetches).toHaveLength(1)
    expect(f.fetches[0]!.init).toMatchObject({ method: 'POST', keepalive: true, credentials: 'same-origin' })
  })

  test('automated browsers are never tracked', () => {
    const f = fakeEnv({ webdriver: true })
    const { track } = createTracker(f.env)
    track('homepage_viewed')
    f.pagehide()
    expect(f.beacons).toHaveLength(0)
  })

  test('dedupes a repeated view of the same path within one second (strict mode)', async () => {
    const f = fakeEnv()
    const { track, flush } = createTracker(f.env)
    track('homepage_viewed')
    track('homepage_viewed')
    f.advanceClock(1500)
    track('homepage_viewed')
    track('cart_opened')
    track('cart_opened')
    flush()
    expect((await eventsIn(f.beacons[0]!.body)).map((e) => e.eventType)).toEqual(['homepage_viewed', 'homepage_viewed', 'cart_opened', 'cart_opened'])
  })

  test('drops an event whose properties exceed 2 KB instead of failing the batch', async () => {
    const f = fakeEnv()
    const { track, flush } = createTracker(f.env)
    track('product_viewed', { blob: 'x'.repeat(3000) })
    track('product_viewed', { handle: 'kit' })
    flush()
    expect(await eventsIn(f.beacons[0]!.body)).toHaveLength(1)
  })
})
