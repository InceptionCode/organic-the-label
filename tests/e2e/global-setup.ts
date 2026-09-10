import { chromium, type FullConfig } from '@playwright/test'

/**
 * Warm every route the E2E suite touches before any test runs.
 *
 * CI spins up a cold `next dev` (Turbopack) server. The first request to each
 * route pays a multi-second on-demand compile; when that happens *inside* a test
 * it eats the test's action budget and causes hydration-race flakes on the slow
 * GitHub runner. Compiling everything once up front means every test starts
 * against an already-compiled, RSC-primed route.
 */
const ROUTES = [
  '/',
  '/store',
  '/compositions',
  '/free',
  '/contact',
  '/work-with-me',
  '/login',
  '/signup',
  '/newsletter',
  '/search',
  '/explore',
]

export default async function globalSetup(config: FullConfig) {
  const baseURL =
    config.projects[0]?.use?.baseURL ||
    process.env.PLAYWRIGHT_BASE_URL ||
    'http://localhost:3000'

  const browser = await chromium.launch()
  const page = await browser.newPage({ baseURL })

  for (const route of ROUTES) {
    try {
      await page.goto(route, { waitUntil: 'load', timeout: 90_000 })
      // Let client chunks download + hydrate so the RSC/route cache is primed.
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(300)
    } catch (err) {
      console.warn(`[global-setup] warm-up for ${route} failed (continuing):`, (err as Error).message)
    }
  }

  // Warm the first product detail route too (dynamic segment compiles separately).
  try {
    await page.goto('/store', { waitUntil: 'load', timeout: 60_000 })
    const href = await page
      .locator('[data-testid="product-card-link"]')
      .first()
      .getAttribute('href', { timeout: 15_000 })
    if (href) {
      await page.goto(href, { waitUntil: 'load', timeout: 90_000 })
      await page.waitForTimeout(300)
    }
  } catch (err) {
    console.warn('[global-setup] product detail warm-up failed (continuing):', (err as Error).message)
  }

  await browser.close()
}
