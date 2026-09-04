import { test, expect } from '@playwright/test'

/**
 * E2E tests for email capture forms.
 *
 * Tests the /free and /contact pages against the running dev server.
 * Both pages POST to real API routes — Supabase + MailerLite calls happen
 * in the background. Tests assert on UI state only (success messages).
 *
 * @smoke — fast smoke-suite subset; run with:
 *   pnpm test:e2e:smoke
 */

// ─── /free — Free Starter Kit ─────────────────────────────────────────────────

test.describe('/free — starter kit request form', () => {
  test('page loads and shows the form @smoke', async ({ page }) => {
    await page.goto('/free')

    // Verify the page renders without crashing
    await expect(page).toHaveTitle(/organic/i)

    // Email input must be visible
    await expect(page.getByPlaceholder('your@email.com').first()).toBeVisible()
  })

  test('shows a success state after submitting a valid email', async ({ page }) => {
    await page.goto('/free')

    // Fill required email field
    await page.getByPlaceholder('your@email.com').first().fill('e2e-free@example.com')

    // Optionally fill first name
    await page.getByPlaceholder('Jay').fill('E2E Test')

    // Submit the form
    await page.locator('button[type="submit"]').click()

    // Success state: "IT'S ON THE WAY" heading should appear
    await expect(page.getByText(/on the way/i)).toBeVisible({ timeout: 10000 })
  })

  test('does not submit when email field is empty', async ({ page }) => {
    await page.goto('/free')

    // Click submit without filling the required email
    await page.locator('button[type="submit"]').click()

    // Browser native validation prevents form submission — success message must NOT appear
    await expect(page.getByText(/on the way/i)).not.toBeVisible()
  })

  test('first name field is optional — form submits without it', async ({ page }) => {
    await page.goto('/free')

    await page.getByPlaceholder('your@email.com').first().fill('e2e-noname@example.com')
    // Leave first name blank intentionally

    await page.locator('button[type="submit"]').click()

    await expect(page.getByText(/on the way/i)).toBeVisible({ timeout: 10000 })
  })
})

// ─── /contact — Support Form ──────────────────────────────────────────────────

test.describe('/contact — support form', () => {
  test('page loads and shows the form @smoke', async ({ page }) => {
    await page.goto('/contact')

    await expect(page).toHaveTitle(/organic/i)

    // Key form fields must be visible
    await expect(page.getByPlaceholder('Your name')).toBeVisible()
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible()
    await expect(page.getByPlaceholder(/Tell us what/i)).toBeVisible()
  })

  test('shows a success state after submitting a valid form', async ({ page }) => {
    await page.goto('/contact')

    await page.getByPlaceholder('Your name').fill('E2E Tester')
    await page.getByPlaceholder('your@email.com').fill('e2e-contact@example.com')
    await page.getByPlaceholder(/Tell us what/i).fill('This is an automated E2E test message for the contact form.')

    await page.locator('button[type="submit"]').click()

    // Success: "MESSAGE RECEIVED" heading should appear
    await expect(page.getByText(/message received/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows an error when message is too short', async ({ page }) => {
    await page.goto('/contact')

    await page.getByPlaceholder('Your name').fill('E2E Tester')
    await page.getByPlaceholder('your@email.com').fill('e2e-contact@example.com')
    await page.getByPlaceholder(/Tell us what/i).fill('Too short')

    await page.locator('button[type="submit"]').click()

    // Client-side validation should catch this before submitting
    await expect(page.getByText(/message received/i)).not.toBeVisible()
  })

  test('category select defaults to General', async ({ page }) => {
    await page.goto('/contact')

    const select = page.locator('select')
    await expect(select).toHaveValue('general')
  })

  test('user can change the support category', async ({ page }) => {
    await page.goto('/contact')

    await page.locator('select').selectOption('download_issue')
    await expect(page.locator('select')).toHaveValue('download_issue')
  })

  test('does not submit when required name field is empty', async ({ page }) => {
    await page.goto('/contact')

    // Leave name blank
    await page.getByPlaceholder('your@email.com').fill('e2e-contact@example.com')
    await page.getByPlaceholder(/Tell us what/i).fill('A long enough test message here.')

    await page.locator('button[type="submit"]').click()

    await expect(page.getByText(/message received/i)).not.toBeVisible()
  })
})
