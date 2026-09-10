import { test, expect } from '@playwright/test'

/**
 * E2E tests for the /work-with-me page.
 *
 * Tests marked @smoke run in the fast suite: pnpm test:e2e:smoke
 */

test('work with me page loads @smoke', async ({ page }) => {
  await page.goto('/work-with-me')

  await expect(page).toHaveTitle(/work with me/i)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/future of sound/i)
})

test('nav exposes the Work With Me link @smoke', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Work With Me' })).toHaveAttribute(
    'href',
    '/work-with-me',
  )
})

test.describe('inquiry form', () => {
  test('primary CTA scrolls to the inquiry form @smoke', async ({ page }) => {
    await page.goto('/work-with-me')

    // The CTA's scroll-to-form handler only works once the client component has
    // hydrated; a pre-hydration click is dropped. Re-clicking after the scroll
    // is idempotent, so retry until the form is in view.
    const cta = page.getByRole('button', { name: /start a project/i }).first()
    await expect(cta).toBeVisible()
    const form = page.locator('#work-with-me-inquiry')
    await expect(async () => {
      await cta.click()
      await expect(form).toBeInViewport({ timeout: 2_000 })
    }).toPass({ timeout: 20_000, intervals: [1_000, 2_000] })

    await expect(form.getByLabel('Message', { exact: false })).toBeVisible()
  })

  test('shows a validation error for a too-short message', async ({ page }) => {
    await page.goto('/work-with-me')

    await page.locator('#wwm-name').fill('Test Producer')
    await page.locator('#wwm-email').fill('producer@example.com')
    await page.locator('#wwm-message').fill('too short')
    await page.getByRole('button', { name: /send message/i }).click()

    await expect(
      page.locator('#work-with-me-inquiry').getByRole('alert'),
    ).toContainText(/at least 10 characters/i)
  })
})
