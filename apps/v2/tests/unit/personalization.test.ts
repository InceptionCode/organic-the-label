import { describe, expect, test } from 'bun:test'
import { activityEventSchema, trackBatchSchema } from '~/server/activity/schema'
import { keys, ttl } from '~/server/cache/keys'
import { FLUSH_PATTERNS } from '~/server/cache/flush'
import { isDefaultStoreView } from '~/lib/recommendation-slots'
import { buildAffinity, hasSignal, rankProducts, scoreProduct, type AffinityEvent } from '~/server/personalization/affinity'
import { deleteAffinity } from '~/server/personalization/invalidate'
import { getRecommendations, type RecommendationDeps } from '~/server/personalization/recommendations'
import { DEFAULT_PREFERENCES } from '~/server/preferences/options'
import type { ProductSummary } from '~/server/shopify/types'
import { fakeSupabase, type Call } from './fake-supabase'

const NOW = new Date('2026-11-04T00:00:00.000Z')
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString()

function product(id: string, over: Partial<ProductSummary> = {}): ProductSummary {
  return {
    id: `gid://shopify/Product/${id}`,
    handle: `handle-${id}`,
    title: `Product ${id}`,
    createdAt: '2026-01-01T00:00:00.000Z',
    category: 'kit',
    tags: [],
    isExclusive: false,
    availableForSale: true,
    image: null,
    variantId: `v-${id}`,
    price: null,
    audioPreview: null,
    ...over,
  }
}

const event = (type: string, props: unknown, days = 0): AffinityEvent => ({ event_type: type, event_properties: props, created_at: daysAgo(days) })
const NO_FAVORITES = { favoriteGenres: [], favoriteProductTypes: [] }

describe('buildAffinity', () => {
  const trapKit = product('1', { category: 'kit', tags: ['trap', 'dark'] })

  test('favorites count +5 each with no decay and need no events', () => {
    const affinity = buildAffinity([], { favoriteGenres: ['trap', 'r&b'], favoriteProductTypes: ['kit'] }, [], NOW)
    expect(affinity).toEqual({ categories: { kit: 5 }, tags: { trap: 5, 'r&b': 5 } })
  })

  test('each event type has its weight, applied to the category and every tag', () => {
    const scored = (type: string) => buildAffinity([event(type, { productId: trapKit.id })], NO_FAVORITES, [trapKit], NOW)
    expect(scored('preview_playlist_completed')).toEqual({ categories: { kit: 4 }, tags: { trap: 4, dark: 4 } })
    expect(scored('audio_preview_played')).toEqual({ categories: { kit: 3 }, tags: { trap: 3, dark: 3 } })
    expect(scored('product_viewed')).toEqual({ categories: { kit: 2 }, tags: { trap: 2, dark: 2 } })
  })

  test('events halve every 14 days', () => {
    const at = (days: number) => buildAffinity([event('product_viewed', { productId: trapKit.id }, days)], NO_FAVORITES, [trapKit], NOW).categories.kit
    expect(at(14)).toBeCloseTo(1, 10)
    expect(at(28)).toBeCloseTo(0.5, 10)
    expect(at(7)).toBeCloseTo(2 * 0.5 ** 0.5, 10)
  })

  test('a future timestamp does not count for more than a current one', () => {
    const affinity = buildAffinity([event('product_viewed', { productId: trapKit.id }, -30)], NO_FAVORITES, [trapKit], NOW)
    expect(affinity.categories.kit).toBe(2)
  })

  test('events add up across products and resolve by productId first, then handle', () => {
    const other = product('2', { category: 'pack', tags: ['trap'] })
    const affinity = buildAffinity(
      [
        // The id wins over a handle that names a different product.
        event('product_viewed', { productId: trapKit.id, handle: other.handle }),
        event('audio_preview_played', { handle: other.handle }),
      ],
      NO_FAVORITES,
      [trapKit, other],
      NOW,
    )
    expect(affinity).toEqual({ categories: { kit: 2, pack: 3 }, tags: { trap: 5, dark: 2 } })
  })

  test('unknown products, loops, other event types and malformed rows are ignored', () => {
    const affinity = buildAffinity(
      [
        event('product_viewed', { productId: 'gid://shopify/Product/404', handle: 'gone' }),
        event('audio_preview_played', { surface: 'composition', title: 'Loop', slug: 'loop' }),
        event('store_viewed', { productId: trapKit.id }),
        event('constructor', { productId: trapKit.id }),
        event('product_viewed', { productId: 42, handle: ['x'] }),
        event('product_viewed', null),
        { event_type: 'product_viewed', event_properties: { productId: trapKit.id }, created_at: 'not a date' },
      ],
      NO_FAVORITES,
      [trapKit],
      NOW,
    )
    expect(affinity).toEqual({ categories: {}, tags: {} })
    expect(hasSignal(affinity)).toBe(false)
  })

  test('catalog tags named like object members score as plain tags', () => {
    const odd = product('3', { category: '', tags: ['constructor'] })
    const affinity = buildAffinity([event('product_viewed', { productId: odd.id })], NO_FAVORITES, [odd], NOW)
    expect(affinity.tags.constructor as unknown).toBe(2)
    expect(scoreProduct({ categories: {}, tags: {} }, odd)).toBe(0)
  })
})

describe('rankProducts', () => {
  const affinity = { categories: { kit: 1 }, tags: { trap: 5 } }

  test('highest score first, newest first on a tie, nothing that scores zero, up to the limit', () => {
    const older = product('old', { tags: ['trap'], createdAt: '2026-01-01T00:00:00.000Z' })
    const newer = product('new', { tags: ['trap'], createdAt: '2026-06-01T00:00:00.000Z' })
    const weak = product('weak', { createdAt: '2026-09-01T00:00:00.000Z' })
    const none = product('none', { category: 'merch', createdAt: '2026-10-01T00:00:00.000Z' })
    expect(rankProducts(affinity, [none, weak, older, newer], 10).map((p) => p.handle)).toEqual([newer.handle, older.handle, weak.handle])
    expect(rankProducts(affinity, [none, weak, older, newer], 1).map((p) => p.handle)).toEqual([newer.handle])
  })
})

describe('getRecommendations', () => {
  const trapKit = product('1', { tags: ['trap'] })
  const newerKit = product('2', { tags: ['trap'], createdAt: '2026-05-01T00:00:00.000Z' })
  const sold = product('3', { tags: ['trap'], availableForSale: false })
  const merch = product('4', { category: 'merch', tags: [] })
  const catalog = [trapKit, newerKit, sold, merch]

  type Rows = { prefs?: unknown; events?: unknown[]; entitlements?: unknown[]; failOn?: string }

  function setup(rows: Rows = {}, over: Partial<RecommendationDeps> = {}) {
    const fake = fakeSupabase((call: Call) => {
      if (rows.failOn === call.table) return { data: null, error: { message: 'boom' } }
      if (call.table === 'user_preferences') {
        return {
          data:
            rows.prefs === undefined
              ? { favorite_genres: ['trap'], favorite_product_types: [], marketing_opt_in: false, personalization_opt_in: true }
              : rows.prefs,
          error: null,
        }
      }
      if (call.table === 'activity_events') return { data: rows.events ?? [], error: null }
      if (call.table === 'entitlements') return { data: rows.entitlements ?? [], error: null }
      return { data: null, error: null }
    })
    const stored = new Map<string, unknown>()
    const deps: RecommendationDeps = {
      client: fake.client,
      now: () => NOW,
      loadCatalog: async () => catalog,
      // Same contract as getCached: a hit is returned, a miss builds and stores only when allowed.
      cache: (async (key: string, _ttl: number, fetcher: () => Promise<unknown>, opts?: { shouldCache?: (v: never) => boolean }) => {
        if (stored.has(key)) return stored.get(key)
        const value = await fetcher()
        if (opts?.shouldCache?.(value as never) ?? true) stored.set(key, value)
        return value
      }) as RecommendationDeps['cache'],
      ...over,
    }
    return { deps, calls: fake.calls, stored, tables: () => fake.calls.map((c) => c.table) }
  }

  const ask = (deps: RecommendationDeps) => getRecommendations({ userId: 'u1', slot: 'explore', limit: 4 }, deps)
  const handles = (r: { products: ProductSummary[] }) => r.products.map((p) => p.handle)
  const OFF = { favorite_genres: ['trap'], favorite_product_types: [], marketing_opt_in: false, personalization_opt_in: false }

  test('returns ranked products with source rules, ties going to the newest', async () => {
    const { deps } = setup()
    const result = await ask(deps)
    expect(result.source).toBe('rules')
    expect(handles(result)).toEqual([newerKit.handle, trapKit.handle])
  })

  test('opted out: returns nothing and reads no activity, entitlements or catalog', async () => {
    let catalogReads = 0
    const { deps, tables, stored } = setup({ prefs: OFF }, { loadCatalog: async () => (catalogReads++, catalog) })
    expect(await ask(deps)).toEqual({ products: [], source: 'rules' })
    expect(tables()).toEqual(['user_preferences'])
    expect(catalogReads).toBe(0)
    expect(stored.size).toBe(0)
  })

  test('activity is read for this user, last 90 days, newest first, at most 500 rows', async () => {
    const { deps, calls } = setup()
    await ask(deps)
    const read = calls.find((c) => c.table === 'activity_events')!
    expect(read.filters).toEqual(
      expect.arrayContaining([
        ['eq', 'user_id', 'u1'],
        ['gte', 'created_at', daysAgo(90)],
        ['order', 'created_at', { ascending: false }],
        ['limit', 'limit', 500],
      ]),
    )
  })

  test('owned and unavailable products are excluded', async () => {
    const { deps } = setup({ entitlements: [{ product_gid: newerKit.id, source: 'order', granted_at: daysAgo(1), expires_at: null }] })
    expect(handles(await ask(deps))).toEqual([trapKit.handle])
  })

  test('guest purchases are claimed before entitlements are read, and a failed claim shows nothing', async () => {
    const order: string[] = []
    const { deps, calls } = setup({}, { claimEntitlements: async () => void order.push(`claim after ${calls.filter((c) => c.table === 'entitlements').length} reads`) })
    expect((await ask(deps)).products.length).toBe(2)
    expect(order).toEqual(['claim after 0 reads'])

    const failing = setup({}, { claimEntitlements: async () => { throw new Error('nope') } })
    expect((await ask(failing.deps)).products).toEqual([])
  })

  test('the claim does not run for an opted-out user', async () => {
    let claims = 0
    const { deps } = setup({ prefs: OFF }, { claimEntitlements: async () => void claims++ })
    await ask(deps)
    expect(claims).toBe(0)
  })

  test('no signal: returns nothing, and the empty scores are not cached', async () => {
    const { deps, stored, tables } = setup({ prefs: { favorite_genres: [], favorite_product_types: [], marketing_opt_in: false, personalization_opt_in: true } })
    expect((await ask(deps)).products).toEqual([])
    expect(stored.size).toBe(0)
    expect(tables()).not.toContain('entitlements')
  })

  test('a signal that matches no candidate returns nothing rather than new arrivals', async () => {
    const { deps } = setup({ prefs: { favorite_genres: ['ost'], favorite_product_types: [], marketing_opt_in: false, personalization_opt_in: true } })
    expect((await ask(deps)).products).toEqual([])
  })

  test('scores are cached under the user key for 3 hours', async () => {
    let seen: [string, number] | null = null
    const base = setup()
    const { deps } = setup({}, {
      cache: (async (key: string, seconds: number, fetcher: () => Promise<unknown>, opts: unknown) => {
        seen = [key, seconds]
        return (base.deps.cache as (...args: unknown[]) => Promise<unknown>)(key, seconds, fetcher, opts)
      }) as RecommendationDeps['cache'],
    })
    await ask(deps)
    expect(seen!).toEqual(['personalization:affinity:u1', 3 * 60 * 60])
    expect(ttl.personalizationAffinity).toBe(3 * 60 * 60)
    expect(keys.personalizationAffinity('u1')).toBe('personalization:affinity:u1')
  })

  test('with cached scores, opt-in and entitlements are still read fresh and activity is not', async () => {
    const first = setup()
    await ask(first.deps)
    const cached = first.stored.get(keys.personalizationAffinity('u1'))
    const withScores = (rows: Rows) => {
      const s = setup(rows)
      s.stored.set(keys.personalizationAffinity('u1'), cached)
      return s
    }

    const off = withScores({ prefs: OFF })
    expect((await ask(off.deps)).products).toEqual([])
    expect(off.tables()).toEqual(['user_preferences'])

    const bought = withScores({ entitlements: [{ product_gid: newerKit.id, source: 'order', granted_at: daysAgo(0), expires_at: null }] })
    expect(handles(await ask(bought.deps))).toEqual([trapKit.handle])
    expect(bought.tables()).toEqual(['user_preferences', 'entitlements'])
  })

  test.each(['user_preferences', 'activity_events', 'entitlements'])('a failing %s read logs and returns nothing', async (table) => {
    const { deps } = setup({ failOn: table })
    const original = console.error
    const logged: unknown[][] = []
    console.error = (...args: unknown[]) => void logged.push(args)
    try {
      expect(await ask(deps)).toEqual({ products: [], source: 'rules' })
    } finally {
      console.error = original
    }
    expect(logged.length).toBe(1)
  })

  test('a failing catalog returns nothing', async () => {
    const { deps } = setup({}, { loadCatalog: async () => { throw new Error('shopify down') } })
    const original = console.error
    console.error = () => {}
    try {
      expect((await ask(deps)).products).toEqual([])
    } finally {
      console.error = original
    }
  })
})

describe('cached score deletion', () => {
  test('deletes the user key and swallows Redis failures', async () => {
    const deleted: string[] = []
    await deleteAffinity('u1', { del: async (key) => (deleted.push(key), 1) })
    expect(deleted).toEqual(['personalization:affinity:u1'])

    const original = console.error
    console.error = () => {}
    try {
      await deleteAffinity('u1', { del: async () => { throw new Error('down') } })
    } finally {
      console.error = original
    }
    await deleteAffinity('u1', null)
  })

  test('/api/cache/flush covers the key family', () => {
    expect(FLUSH_PATTERNS as readonly string[]).toContain('personalization:*')
  })
})

describe('offer events', () => {
  test('the allow-list accepts both with their properties', () => {
    for (const eventType of ['offer_viewed', 'offer_clicked']) {
      const eventProperties = { slot: 'store', productId: 'gid://shopify/Product/1', rank: 1, source: 'rules' }
      expect(activityEventSchema.parse({ eventType, eventProperties })).toEqual({ eventType: eventType as 'offer_viewed', eventProperties })
    }
    expect(trackBatchSchema.safeParse({ events: [{ eventType: 'offer_ignored', eventProperties: {} }] }).success).toBe(false)
  })
})

describe('isDefaultStoreView', () => {
  test('only the plain store is the default view', () => {
    expect(isDefaultStoreView({})).toBe(true)
    for (const search of [{ category: 'kit' }, { tags: 'trap' }, { exclusive: true }, { sort: 'price-low' }, { search: 'wave' }, { after: 'abc' }] as const) {
      expect(isDefaultStoreView(search)).toBe(false)
    }
  })
})

test('DEFAULT_PREFERENCES has recommendations on', () => {
  expect(DEFAULT_PREFERENCES.personalizationOptIn).toBe(true)
})
