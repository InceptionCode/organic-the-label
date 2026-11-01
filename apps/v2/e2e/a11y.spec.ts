import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test, waitForHydration } from './support/fixtures'

// Phase 07.5. axe (WCAG 2.0/2.1/2.2 A and AA) on every route with zero serious or critical
// violations, plus keyboard checks: skip link, cart drawer and auth dialog focus trap and return,
// and form errors announced. Iframes from third parties (Instagram, YouTube, Spotify embeds) are
// excluded: their markup is not ours to fix.

const ROUTES = [
  '/',
  '/store',
  '/store/wave-pack',
  '/compositions',
  '/free',
  '/free/starter-kit',
  '/contact',
  '/newsletter',
  '/explore',
  '/work-with-me',
  '/search',
  '/search?q=wave',
  '/login',
  '/signup',
  '/auth/confirm',
  '/this-route-does-not-exist-e2e',
]

/**
 * Native modal <dialog> (showModal) makes the page behind inert; when Tab wraps, focus may pass
 * through the browser chrome (document.activeElement is <body>). It must never reach page content.
 */
const focusStaysInDialog = (el: Element) => {
  const active = document.activeElement
  return !active || active === document.body || el.contains(active)
}

async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .exclude('iframe')
    // Decorative display text hidden from assistive tech (the footer wordmark, the 404 numeral):
    // WCAG 1.4.3 exempts pure decoration; the real text sits next to it.
    .exclude('[aria-hidden="true"].select-none')
    .analyze()
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ id: v.id, impact: v.impact, help: v.help, targets: v.nodes.slice(0, 5).map((n) => n.target.join(' ')) }))
}

test.describe('axe: no serious or critical violations', () => {
  // Reveal and rise animations would otherwise be measured mid-fade (blended, low-contrast colors).
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  for (const path of ROUTES) {
    test(`${path}`, async ({ page }) => {
      await page.goto(path)
      await waitForHydration(page)
      await page.waitForLoadState('load')
      expect(await seriousViolations(page)).toEqual([])
    })
  }

  test('/account (signed in)', async ({ page, signIn }) => {
    await signIn()
    await page.goto('/account')
    await waitForHydration(page)
    await expect(page.getByRole('heading', { name: 'Your library' })).toBeVisible()
    expect(await seriousViolations(page)).toEqual([])
  })

  test('open cart drawer and login dialog', async ({ page }) => {
    await page.goto('/store')
    await waitForHydration(page)
    await page.getByTestId('cart-icon').click()
    await expect(page.getByRole('dialog', { name: 'Cart' })).toBeVisible()
    expect(await seriousViolations(page)).toEqual([])

    await page.goto('/login')
    await waitForHydration(page)
    await page.getByRole('button', { name: 'Sign in with magic link' }).click()
    await expect(page.getByRole('dialog', { name: 'Sign in with magic link' })).toBeVisible()
    expect(await seriousViolations(page)).toEqual([])
  })
})

test.describe('keyboard @smoke', () => {
  test('skip link is the first tab stop and moves focus to main', async ({ page }) => {
    await page.goto('/store')
    await waitForHydration(page)
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Skip to content' })
    await expect(skip).toBeFocused()
    await expect(skip).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(page.locator('main#main')).toBeFocused()
  })

  test('cart drawer traps focus, closes on Escape and returns focus to the cart button', async ({ page }) => {
    await page.goto('/store')
    await waitForHydration(page)
    const trigger = page.getByTestId('cart-icon')
    await trigger.focus()
    await page.keyboard.press('Enter')
    const drawer = page.getByRole('dialog', { name: 'Cart' })
    await expect(drawer).toBeVisible()
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab')
      expect(await drawer.evaluate(focusStaysInDialog)).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('auth dialog traps focus and returns it to its trigger', async ({ page }) => {
    await page.goto('/login')
    await waitForHydration(page)
    const trigger = page.getByRole('button', { name: 'Forgot password?' })
    await trigger.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Reset Password' })
    await expect(dialog).toBeVisible()
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab')
      expect(await dialog.evaluate(focusStaysInDialog)).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('form errors are announced and tied to their field', async ({ page }) => {
    await page.goto('/newsletter')
    await waitForHydration(page)
    await page.getByRole('button', { name: 'Subscribe' }).click()
    const email = page.getByRole('textbox', { name: 'Email (required)' })
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    const describedBy = await email.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    const message = page.locator(`[id="${describedBy}"]`)
    await expect(message).toHaveText('Enter a valid email address.')
    await expect(message).toHaveAttribute('role', 'alert')

    await page.goto('/login')
    await waitForHydration(page)
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    const loginEmail = page.getByRole('textbox', { name: 'Email' })
    await expect(loginEmail).toBeFocused()
    await expect(loginEmail).toHaveAttribute('aria-invalid', 'true')
    const loginDescribedBy = await loginEmail.getAttribute('aria-describedby')
    await expect(page.locator(`[id="${loginDescribedBy}"]`)).toContainText('Please enter a valid email')
  })
})
