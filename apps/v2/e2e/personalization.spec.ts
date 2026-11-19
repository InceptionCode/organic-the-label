import type { Page } from '@playwright/test'
import { STORE_CATEGORIES, STORE_TAGS } from '../src/lib/store-search'
import { admin, testUserId } from './support/admin'
import { BASE_URL, clearAffinityCache, productGid } from './support/env'
import { expect, serverFnName, test, waitForHydration } from './support/fixtures'

// Rule-based recommendations (phase 09). Runs before or after the default-on migration: every test
// writes the preference it needs, and puts the row back afterwards. Favorites name every option, so any
// product in the dev store can be recommended and no test depends on a title or handle.

const SLOT = '[data-testid="recommendations"]'
const SKELETON = '[data-testid="recommendations-skeleton"]'
const slot = (page: Page, name: 'explore' | 'store') => page.locator(`${SLOT}[data-slot="${name}"]`)

type PreferencesRow = {
  favorite_genres: string[]
  favorite_product_types: string[]
  marketing_opt_in: boolean
  personalization_opt_in: boolean
}

const EVERYTHING = { favorite_genres: STORE_TAGS.filter((t) => t !== 'free'), favorite_product_types: [...STORE_CATEGORIES] }

async function setPreferences(userId: string, optIn: boolean) {
  const { error } = await admin()
    .from('user_preferences')
    .update({ ...EVERYTHING, personalization_opt_in: optIn })
    .eq('user_id', userId)
  if (error) throw new Error(`setting preferences failed: ${error.message}`)
  await clearAffinityCache(userId)
}

/** Handles the slot links to, once it has finished loading. */
async function recommendedHandles(page: Page): Promise<string[]> {
  await expect(page.locator(SKELETON)).toHaveCount(0)
  const hrefs = await page.locator(`${SLOT} [data-testid="product-card-link"]`).evaluateAll((links) => links.map((a) => a.getAttribute('href') ?? ''))
  return hrefs.map((href) => href.replace(/^\/store\//, ''))
}

test.describe('recommendations', () => {
  let userId: string
  let original: PreferencesRow | null = null
  let entitlementId: string | null = null

  test.beforeEach(async () => {
    userId = await testUserId()
    const { data } = await admin()
      .from('user_preferences')
      .select('favorite_genres, favorite_product_types, marketing_opt_in, personalization_opt_in')
      .eq('user_id', userId)
      .single()
    original = data as PreferencesRow | null
    await clearAffinityCache(userId)
  })

  test.afterEach(async () => {
    if (entitlementId) await admin().from('entitlements').delete().eq('id', entitlementId)
    entitlementId = null
    if (original) await admin().from('user_preferences').update(original).eq('user_id', userId)
    await admin().from('activity_events').delete().eq('user_id', userId)
    await clearAffinityCache(userId)
  })

  test('a signed-in user with favorites sees both slots, up to 4 products @smoke', async ({ page, signIn }) => {
    await setPreferences(userId, true)
    await signIn()

    await page.goto('/explore')
    await expect(slot(page, 'explore').getByRole('heading', { name: 'RECOMMENDED FOR YOU' })).toBeVisible()
    const explore = await recommendedHandles(page)
    expect(explore.length).toBeGreaterThan(0)
    expect(explore.length).toBeLessThanOrEqual(4)
    // Directly after the hero.
    expect(
      await page.evaluate(() => document.querySelector('[data-testid="recommendations"]')?.previousElementSibling?.id),
    ).toBe('explore-hero')

    await page.goto('/store')
    await expect(slot(page, 'store').getByRole('heading', { name: 'FOR YOU' })).toBeVisible()
    expect((await recommendedHandles(page)).length).toBeGreaterThan(0)
  })

  test('the signed-in HTML holds the space with a skeleton and carries no recommendations', async ({ page, signIn }) => {
    await setPreferences(userId, true)
    await signIn()
    for (const path of ['/explore', '/store']) {
      const res = await page.request.get(path)
      expect(res.headers()['cache-control'] ?? '', path).not.toMatch(/public|s-maxage/)
      const html = await res.text()
      expect(html, path).toContain('data-testid="recommendations-skeleton"')
      expect(html, path).not.toContain('data-testid="recommendations"')
    }
  })

  test('the store row only shows on the default view', async ({ page, signIn }) => {
    await setPreferences(userId, true)
    await signIn()
    for (const path of ['/store?category=kit', '/store?tags=trap', '/store?search=wave', '/store?sort=price-low', '/store?exclusive=true']) {
      await page.goto(path)
      await waitForHydration(page)
      await expect(page.locator(SKELETON), path).toHaveCount(0)
      await expect(page.locator(SLOT), path).toHaveCount(0)
    }
  })

  test('turning the checkbox off hides both slots on the next load', async ({ page, signIn }) => {
    await setPreferences(userId, true)
    await signIn()
    await page.goto('/explore')
    await expect(slot(page, 'explore')).toBeVisible()

    await page.goto('/account')
    await waitForHydration(page)
    const box = page.getByRole('checkbox', { name: /Recommend sounds for me/ })
    await expect(box).toBeChecked()
    await box.uncheck()
    await page.getByRole('button', { name: 'Save preferences' }).click()
    await expect(page.getByText(/^Preferences saved/)).toBeVisible()

    for (const path of ['/explore', '/store']) {
      await page.goto(path)
      await waitForHydration(page)
      await expect(page.locator(SKELETON), path).toHaveCount(0)
      await expect(page.locator(SLOT), path).toHaveCount(0)
    }

    // And back on, with nothing left behind from the earlier state.
    await page.goto('/account')
    await waitForHydration(page)
    await page.getByRole('checkbox', { name: /Recommend sounds for me/ }).check()
    await page.getByRole('button', { name: 'Save preferences' }).click()
    await expect(page.getByText(/^Preferences saved/)).toBeVisible()
    await page.goto('/explore')
    await expect(slot(page, 'explore')).toBeVisible()
  })

  test('an owned product is never shown, even with cached scores', async ({ page, signIn }) => {
    await setPreferences(userId, true)
    await signIn()
    await page.goto('/explore')
    await expect(slot(page, 'explore')).toBeVisible()
    const [top] = await recommendedHandles(page)
    expect(top).toBeTruthy()

    const product_gid = await productGid(top!)
    await admin().from('entitlements').delete().eq('user_id', userId).eq('product_gid', product_gid)
    const { data, error } = await admin().from('entitlements').insert({ user_id: userId, product_gid, source: 'manual' }).select('id').single()
    if (error || !data) throw new Error(`seeding the entitlement failed: ${error?.message}`)
    entitlementId = (data as { id: string }).id

    for (const path of ['/explore', '/store']) {
      await page.goto(path)
      await waitForHydration(page)
      expect(await recommendedHandles(page), path).not.toContain(top)
    }
  })

  test('a failing call collapses the slot and leaves the page intact', async ({ page, signIn }) => {
    await setPreferences(userId, true)
    await signIn()
    await page.route('**/_serverFn/**', (route) => {
      if (serverFnName(route.request().url()) === 'getRecommendationsFn') return route.fulfill({ status: 500, body: '{}' })
      return route.fallback()
    })
    await page.goto('/store')
    await waitForHydration(page)
    await expect(page.locator(SKELETON)).toHaveCount(0)
    await expect(page.locator(SLOT)).toHaveCount(0)
    await expect(page.getByTestId('product-card').first()).toBeVisible()
  })

  test.describe('offer events', () => {
    // The client queue is off for automated browsers (src/lib/track.ts), so this browser presents as a
    // normal one and the events travel the real path: slot, queue, beacon, /api/track, database.
    test.use({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    })

    type OfferRow = { event_properties: { slot: string; productId: string; rank: number; source: string } }

    const offerRows = async (eventType: string) => {
      const { data } = await admin().from('activity_events').select('event_properties').eq('user_id', userId).eq('event_type', eventType)
      return (data ?? []) as OfferRow[]
    }
    const flushQueue = (page: Page) => page.evaluate(() => window.dispatchEvent(new Event('pagehide')))

    test('offer_viewed is sent once per product, offer_clicked when a link is followed', async ({ page, signIn }) => {
      await page.addInitScript(() => {
        Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false })
        // Normal browsers get the session splash; this test is not about it.
        sessionStorage.setItem('splashSeen', 'true')
      })
      await setPreferences(userId, true)
      await signIn()
      await page.goto('/explore')
      await waitForHydration(page)
      await expect(slot(page, 'explore')).toBeVisible()
      const handles = await recommendedHandles(page)

      const links = slot(page, 'explore').getByTestId('product-card')
      for (let i = 0; i < handles.length; i++) {
        await links.nth(i).scrollIntoViewIfNeeded()
        await page.waitForTimeout(150)
      }
      await page.evaluate(() => window.scrollBy(0, -100))
      await page.waitForTimeout(150)
      await flushQueue(page)

      await expect.poll(async () => (await offerRows('offer_viewed')).length, { timeout: 15_000 }).toBe(handles.length)
      const viewed = (await offerRows('offer_viewed')).map((r) => r.event_properties)
      expect(viewed.map((p) => p.rank).sort()).toEqual(handles.map((_, i) => i + 1))
      for (const props of viewed) {
        expect(props.slot).toBe('explore')
        expect(props.source).toBe('rules')
        expect(props.productId).toMatch(/^gid:\/\/shopify\/Product\//)
      }
      const firstGid = await productGid(handles[0]!)
      expect(viewed.find((p) => p.rank === 1)?.productId).toBe(firstGid)

      await slot(page, 'explore').getByTestId('product-card-link').first().click()
      await expect(page).toHaveURL(new RegExp(`/store/${handles[0]}$`))
      await flushQueue(page)
      await expect.poll(async () => (await offerRows('offer_clicked')).length, { timeout: 15_000 }).toBe(1)
      expect((await offerRows('offer_clicked'))[0]!.event_properties).toEqual({ slot: 'explore', productId: firstGid, rank: 1, source: 'rules' })
      // No repeat views from the same mount.
      expect((await offerRows('offer_viewed')).length).toBe(handles.length)
    })
  })
})

test.describe('anonymous visitors', () => {
  test('/explore and /store have no slot markup and keep their public cache headers @smoke', async ({ request }) => {
    for (const path of ['/explore', '/store']) {
      const res = await request.get(path)
      expect(res.status(), path).toBe(200)
      expect(res.headers()['cache-control'], path).toBe('public, s-maxage=60, stale-while-revalidate=600')
      const html = await res.text()
      for (const marker of ['recommendations-skeleton', 'data-testid="recommendations"', 'explore-recommended', 'RECOMMENDED FOR YOU', 'FOR YOU<']) {
        expect(html, `${path} ${marker}`).not.toContain(marker)
      }
    }
  })

  test('make no recommendations request', async ({ page, sandbox: _ }) => {
    const fns: string[] = []
    page.on('request', (req) => {
      const name = serverFnName(req.url())
      if (name) fns.push(name)
    })
    for (const path of ['/explore', '/store']) {
      await page.goto(new URL(path, BASE_URL).toString(), { waitUntil: 'networkidle' })
      await waitForHydration(page)
      await expect(page.locator(`${SLOT}, ${SKELETON}`)).toHaveCount(0)
    }
    expect(fns).not.toContain('getRecommendationsFn')
  })
})
