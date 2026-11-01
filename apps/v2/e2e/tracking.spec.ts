import { admin, testUserId } from './support/admin'
import { BASE_URL } from './support/env'
import { expect, test } from './support/fixtures'

// Activity tracking. Playwright sets navigator.webdriver, so the client queue (src/lib/track.ts)
// deliberately sends nothing from these browsers; its batching, dedupe and webdriver no-op are unit
// tested (tests/unit/track-queue.test.ts). Here the endpoint itself is driven END TO END the way the
// queue calls it: a same-origin POST with a real browser user agent, from the test browser's cookie
// jar, and the rows are checked in the DEV database, then deleted. No test-only switch exists in the app.

const REAL_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
const sameOrigin = { Origin: new URL(BASE_URL).origin, 'User-Agent': REAL_UA, 'Content-Type': 'application/json' }
const batch = (marker: string, eventType = 'store_viewed') => ({ events: [{ eventType, eventProperties: { e2e: marker } }] })

test.describe('POST /api/track', () => {
  test('anonymous: creates the visitor lazily and records the batch @smoke', async ({ page, context, sandbox: _ }) => {
    const marker = `anon-${Date.now()}`
    const res = await page.request.post('/api/track', { headers: sameOrigin, data: batch(marker) })
    expect(res.status()).toBe(204)
    expect(res.headers()['cache-control']).toBe('no-store')

    const anon = (await context.cookies()).find((c) => c.name === 'anon_token')
    expect(anon?.httpOnly).toBe(true)
    const { data: visitor } = await admin().from('anonymous_visitors').select('id').eq('anon_token', anon!.value).single()
    const { data: rows } = await admin()
      .from('activity_events')
      .select('event_type, user_id, anonymous_visitor_id, event_properties')
      .eq('anonymous_visitor_id', (visitor as { id: string }).id)
    expect(rows).toEqual([{ event_type: 'store_viewed', user_id: null, anonymous_visitor_id: (visitor as { id: string }).id, event_properties: { e2e: marker } }])
    // The visitor (and its rows) are removed by the visitor cleanup fixture.
  })

  test('signed in: rows belong to the user, not a visitor', async ({ page, signIn }) => {
    await signIn()
    const marker = `user-${Date.now()}`
    const res = await page.request.post('/api/track', { headers: sameOrigin, data: batch(marker, 'explore_viewed') })
    expect(res.status()).toBe(204)
    const userId = await testUserId()
    const { data: rows } = await admin()
      .from('activity_events')
      .select('event_type, user_id, anonymous_visitor_id')
      .eq('user_id', userId)
      .eq('event_properties->>e2e', marker)
    expect(rows).toEqual([{ event_type: 'explore_viewed', user_id: userId, anonymous_visitor_id: null }])
    await admin().from('activity_events').delete().eq('user_id', userId).eq('event_properties->>e2e', marker)
  })

  test('rejects cross-site, bots and bad batches without writing', async ({ page, context, sandbox: _ }) => {
    const crossSite = await page.request.post('/api/track', {
      headers: { ...sameOrigin, Origin: 'https://evil.example', 'Sec-Fetch-Site': 'cross-site' },
      data: batch('x'),
    })
    expect(crossSite.status()).toBe(403)

    const bot = await page.request.post('/api/track', { headers: { ...sameOrigin, 'User-Agent': 'Googlebot/2.1' }, data: batch('x') })
    expect(bot.status()).toBe(204)

    // Server-only events are never accepted from the client.
    const serverOnly = await page.request.post('/api/track', { headers: sameOrigin, data: batch('x', 'resource_downloaded') })
    expect(serverOnly.status()).toBe(400)
    const empty = await page.request.post('/api/track', { headers: sameOrigin, data: { events: [] } })
    expect(empty.status()).toBe(400)

    // None of these created a visitor.
    expect((await context.cookies()).find((c) => c.name === 'anon_token')).toBeUndefined()
  })

  test('the client queue sends nothing from an automated browser', async ({ page }) => {
    const beacons: string[] = []
    page.on('request', (req) => {
      if (new URL(req.url()).pathname === '/api/track') beacons.push(req.url())
    })
    await page.goto('/store')
    await page.getByRole('button', { name: /^Play .* preview$/ }).first().click()
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
    await page.waitForTimeout(500)
    expect(await page.evaluate(() => navigator.webdriver)).toBe(true)
    expect(beacons).toHaveLength(0)
  })
})

test.describe('private server fns', () => {
  test('answer 401 without a session (requireUser is the boundary, not the route guard) @smoke', async ({ request }) => {
    // Dev-server server fn ids are base64url JSON naming the module and export.
    const id = (file: string, name: string) =>
      Buffer.from(JSON.stringify({ file: `/src/fns/${file}?tss-serverfn-split`, export: `${name}_createServerFn_handler` })).toString('base64url')
    for (const [file, name] of [
      ['account.fn.ts', 'getOwnedProductsFn'],
      ['account.fn.ts', 'getAccountSummaryFn'],
      ['preferences.fn.ts', 'getPreferencesFn'],
    ] as const) {
      // A cross-site call is refused by the CSRF middleware first.
      const crossSite = await request.get(`/_serverFn/${id(file, name)}`, { headers: { 'x-tsr-serverFn': 'true', 'Sec-Fetch-Site': 'cross-site' } })
      expect(crossSite.status(), `${name} cross-site`).toBe(403)
      // Same origin, no session: requireUser answers 401.
      const res = await request.get(`/_serverFn/${id(file, name)}`, { headers: { 'x-tsr-serverFn': 'true', 'Sec-Fetch-Site': 'same-origin' } })
      expect(res.status(), name).toBe(401)
    }
  })
})
