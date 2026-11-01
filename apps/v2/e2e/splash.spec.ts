import type { Page, Request } from '@playwright/test'
import { expect, test, waitForHydration } from './support/fixtures'

// Phase 07.7 session splash. Playwright's Chromium reports navigator.webdriver, so the splash never
// shows on its own here (that is the first test); `?splash=force` shows it regardless. The `__scrub`
// hook exists only in dev builds (this suite runs against the dev server).

const FRAME = /\/organic-sonics-hero\/assets\/hero(-mobile)?\/frame_\d{4}\.webp$/
const splash = (page: Page) => page.getByRole('dialog', { name: 'Welcome to Organic Sonics' })

type ScrubEl = HTMLElement & { __scrub?: (p: number) => void }

function collectFrames(page: Page) {
  const urls: string[] = []
  page.on('request', (req: Request) => {
    if (FRAME.test(new URL(req.url()).pathname)) urls.push(new URL(req.url()).pathname)
  })
  return urls
}

async function openForced(page: Page, path = '/') {
  await page.goto(`${path}${path.includes('?') ? '&' : '?'}splash=force`)
  await waitForHydration(page)
  await expect(splash(page)).toBeVisible()
}

test.describe('session splash', () => {
  test('does not show under webdriver and requests no frames', async ({ page }) => {
    const frames = collectFrames(page)
    await page.goto('/')
    await waitForHydration(page)
    // The gate decides after load plus idle (idle timeout 2s).
    await page.waitForLoadState('load')
    await page.waitForTimeout(2500)
    await expect(page.locator('[data-testid="session-splash"]')).toHaveCount(0)
    expect(frames).toEqual([])
  })

  test('is never in the server HTML', async ({ request }) => {
    const html = await (await request.get('/?splash=force')).text()
    expect(html).not.toContain('session-splash')
    expect(html).not.toContain('Welcome to Organic Sonics')
    expect(html).not.toContain('organic-sonics-hero')
  })

  test('?splash=force shows it; focus moves to Skip; scroll is locked, then restored on Skip', async ({ page }) => {
    await openForced(page)
    await expect(page.getByTestId('splash-skip')).toBeFocused()
    await expect(page.getByRole('heading', { name: 'The studio opens' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('hidden')
    // The page underneath stays in the DOM (inert behind the modal).
    await expect(page.locator('main#main')).toHaveCount(1)

    await page.getByTestId('splash-skip').click()
    await expect(page.locator('[data-testid="session-splash"]')).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('')
    expect(await page.evaluate(() => sessionStorage.getItem('splashSeen'))).toBe('true')
    await page.mouse.wheel(0, 600)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  })

  test('Enter site and Escape dismiss it', async ({ page }) => {
    await openForced(page)
    await page.getByTestId('splash-enter').click()
    await expect(page.locator('[data-testid="session-splash"]')).toHaveCount(0)

    await openForced(page)
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-testid="session-splash"]')).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('')
  })

  test('scrubbing advances frames, and one scroll past the end enters', async ({ page }) => {
    const frames = collectFrames(page)
    await openForced(page)
    const hero = page.locator('[data-scrub-hero]')
    await expect(hero).toHaveAttribute('data-frame-set', 'desktop')
    await expect.poll(() => hero.getAttribute('data-frame')).toBe('0')
    expect(frames[0]).toBe('/organic-sonics-hero/assets/hero/frame_0000.webp')
    expect(frames.every((f) => f.includes('/hero/'))).toBe(true)

    // Real input: wheel and arrow keys move progress forward.
    await page.mouse.move(400, 400)
    for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 50)
    await expect.poll(async () => Number(await hero.getAttribute('data-progress'))).toBeGreaterThan(0.05)
    const afterWheel = Number(await hero.getAttribute('data-progress'))
    await page.keyboard.press('ArrowDown')
    await expect.poll(async () => Number(await hero.getAttribute('data-progress'))).toBeGreaterThan(afterWheel)

    // Test hook: jump to the middle once those frames are in.
    await expect.poll(async () => Number(await hero.getAttribute('data-frames-ready')), { timeout: 30_000 }).toBeGreaterThan(80)
    await hero.evaluate((el: ScrubEl) => el.__scrub?.(0.5))
    await expect(hero).toHaveAttribute('data-progress', '0.500')
    expect(Number(await hero.getAttribute('data-frame'))).toBeGreaterThan(60)
    await expect(page.getByText('Every session starts with one sound.')).toBeVisible()

    await hero.evaluate((el: ScrubEl) => el.__scrub?.(1.3))
    await expect(page.locator('[data-testid="session-splash"]')).toHaveCount(0)
  })

  test('requests no frame before it shows, at most 6 at a time, and stops on dismiss', async ({ page }) => {
    const notShown: string[] = []
    let inFlight = 0
    let maxInFlight = 0
    let requested = 0
    await page.route(FRAME, async (route) => {
      requested += 1
      inFlight += 1
      maxInFlight = Math.max(maxInFlight, inFlight)
      const shown = await page.evaluate(() => document.querySelector('dialog[data-testid="session-splash"]') !== null).catch(() => true)
      if (!shown) notShown.push(route.request().url())
      await new Promise((r) => setTimeout(r, 250))
      inFlight -= 1
      await route.continue().catch(() => {})
    })
    await openForced(page)
    await expect.poll(() => requested).toBeGreaterThan(0)
    await page.getByTestId('splash-skip').click()
    await expect(page.locator('[data-testid="session-splash"]')).toHaveCount(0)
    const atDismiss = requested
    await page.waitForTimeout(1500)
    expect(notShown).toEqual([])
    expect(maxInFlight).toBeLessThanOrEqual(6)
    // Only requests already in flight at dismiss may still land; the queue stops.
    expect(requested).toBeLessThanOrEqual(atDismiss + 6)
    expect(requested).toBeLessThan(153)
  })
})

test.describe('session splash on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 })

  test('loads the lighter mobile frame set', async ({ page }) => {
    const frames = collectFrames(page)
    await openForced(page)
    const hero = page.locator('[data-scrub-hero]')
    await expect(hero).toHaveAttribute('data-frame-set', 'mobile')
    await expect.poll(() => hero.getAttribute('data-frame')).toBe('0')
    expect(frames.length).toBeGreaterThan(0)
    expect(frames.every((f) => f.startsWith('/organic-sonics-hero/assets/hero-mobile/'))).toBe(true)
    await page.getByTestId('splash-skip').tap()
    await expect(page.locator('[data-testid="session-splash"]')).toHaveCount(0)
  })
})
