import { expect, test } from './support/fixtures'

// Every public route: status, title, and the canonical / noindex rule from src/seo/head.ts
// (indexable pages emit exactly one canonical on the production origin and no robots meta; noindex
// pages emit `noindex, follow` and no canonical). Product and free resource slugs come from the dev
// catalog; if those change, update KNOWN_* below.

const ORIGIN = 'https://organicsonics.com'
const KNOWN_PRODUCT = '/store/wave-pack'
const KNOWN_FREE = '/free/starter-kit'

const INDEXABLE: { path: string; title: RegExp }[] = [
  { path: '/', title: /^Premium Sounds for Modern Producers \| Organic Sonics$/ },
  { path: '/store', title: /^Store: Beats, Drum Kits and Sample Packs \| Organic Sonics$/ },
  { path: KNOWN_PRODUCT, title: /^Wave Pack \| Organic Sonics$/ },
  { path: '/compositions', title: /^Compositions: Free Loops and Samples \| Organic Sonics$/ },
  { path: '/free', title: /\| Organic Sonics$/ },
  { path: KNOWN_FREE, title: /\| Organic Sonics$/ },
  { path: '/contact', title: /^Contact \| Organic Sonics$/ },
  { path: '/newsletter', title: /^Newsletter \| Organic Sonics$/ },
  { path: '/explore', title: /^Explore \| Organic Sonics$/ },
  { path: '/work-with-me', title: /^Work With Me: Production and Mixing \| Organic Sonics$/ },
]

const NOINDEX: { path: string; title: RegExp; status?: number }[] = [
  { path: '/search', title: /^Search \| Organic Sonics$/ },
  { path: '/search?q=wave', title: /^Search results for "wave" \| Organic Sonics$/ },
  { path: '/login', title: /^Sign in \| Organic Sonics$/ },
  { path: '/signup', title: /^Create account \| Organic Sonics$/ },
  // No token: the "link expired" page, answered 400.
  { path: '/auth/confirm', title: /^Confirm \| Organic Sonics$/, status: 400 },
]

test.describe('public routes @smoke', () => {
  for (const { path, title } of INDEXABLE) {
    test(`${path} is 200, indexable, one canonical`, async ({ page }) => {
      const res = await page.goto(path)
      expect(res?.status()).toBe(200)
      await expect(page).toHaveTitle(title)
      const canonicals = await page.locator('link[rel="canonical"]').evaluateAll((els) => els.map((e) => e.getAttribute('href')))
      expect(canonicals).toEqual([`${ORIGIN}${path === '/' ? '/' : path}`])
      await expect(page.locator('meta[name="robots"]')).toHaveCount(0)
      await expect(page.locator('h1').first()).toBeVisible()
      // Anonymous public HTML is CDN-cacheable (phase 07.3); cache-guard downgrades anything personal.
      expect(res?.headers()['cache-control']).toBe('public, s-maxage=60, stale-while-revalidate=600')
    })
  }

  for (const { path, title, status = 200 } of NOINDEX) {
    test(`${path} is ${status}, noindex, no canonical`, async ({ page }) => {
      const res = await page.goto(path)
      expect(res?.status()).toBe(status)
      await expect(page).toHaveTitle(title)
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
      // Never CDN-cacheable (no header at all is also private on Vercel).
      expect(res?.headers()['cache-control'] ?? '').not.toMatch(/public|s-maxage/)
    })
  }

  test('store filters keep the bare /store canonical', async ({ page }) => {
    await page.goto('/store?category=kit&tags=melodic&sort=price-low')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${ORIGIN}/store`)
  })

  for (const path of ['/store/this-product-does-not-exist-e2e', '/this-route-does-not-exist-e2e', '/free/no-such-resource-e2e']) {
    test(`${path} is a 404 page`, async ({ page }) => {
      const res = await page.goto(path)
      expect(res?.status()).toBe(404)
      await expect(page).toHaveTitle(/^Page not found \| Organic Sonics$/)
      await expect(page.getByTestId('not-found-page')).toBeVisible()
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
    })
  }

  test('sitemap.xml lists public pages only', async ({ request }) => {
    const res = await request.get('/sitemap.xml')
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('xml')
    const xml = await res.text()
    for (const path of ['/', '/store', '/compositions', KNOWN_PRODUCT]) expect(xml).toContain(`<loc>${ORIGIN}${path}</loc>`)
    for (const path of ['/account', '/login', '/search', '/auth/confirm']) expect(xml).not.toContain(`${ORIGIN}${path}<`)
  })

  test('robots.txt responds (disallow all off production)', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('text/plain')
    expect(await res.text()).toContain('User-agent: *')
  })

  test('non-production responses carry X-Robots-Tag', async ({ request }) => {
    const res = await request.get('/')
    expect(res.headers()['x-robots-tag']).toContain('noindex')
  })
})

test.describe('private routes', () => {
  test('/account redirects to login when signed out @smoke', async ({ page }) => {
    await page.goto('/account')
    await expect(page).toHaveURL(/\/login\?redirect=%2Faccount$/)
    await expect(page).toHaveTitle(/^Sign in \| Organic Sonics$/)
  })

  test('/login/reset-password redirects to /login without a recovery session', async ({ page }) => {
    await page.goto('/login/reset-password')
    await expect(page).toHaveURL(/\/login$/)
  })
})
