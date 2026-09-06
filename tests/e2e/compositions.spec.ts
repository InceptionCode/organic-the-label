import { test, expect } from '@playwright/test'

/**
 * E2E tests for the /compositions free-loop browsing flow.
 *
 * Runs against a real (local or preview) app instance with seeded `compositions`
 * rows. Tests marked @smoke run in the fast suite: pnpm test:e2e:smoke
 */

test('compositions page loads @smoke', async ({ page }) => {
  await page.goto('/compositions')

  await expect(page).toHaveTitle(/organic/i)
  await expect(page.locator('[data-testid="composition-filters"]')).toBeVisible()
  await expect(page.locator('[data-testid="composition-grid"]')).toBeVisible()
})

test.describe('compositions browsing', () => {
  test('user sees a list of loop cards, each with a download action', async ({ page }) => {
    await page.goto('/compositions')

    const firstCard = page.locator('[data-testid="composition-card"]').first()
    await expect(firstCard).toBeVisible()
    expect(await page.locator('[data-testid="composition-card"]').count()).toBeGreaterThan(0)

    await expect(firstCard.getByRole('button', { name: /download loop/i })).toBeVisible()
  })

  test('the newsletter CTA links to /newsletter', async ({ page }) => {
    await page.goto('/compositions')
    await expect(page.getByRole('link', { name: /join the newsletter/i })).toHaveAttribute(
      'href',
      '/newsletter',
    )
  })

  test('user can apply a search filter @smoke', async ({ page }) => {
    await page.goto('/compositions')
    await expect(page.locator('[data-testid="composition-filters"]')).toBeVisible()

    await page.getByLabel('Search loops').fill('loop')

    await expect(page.getByLabel('Search loops')).toHaveValue('loop', { timeout: 3_000 })
    await expect(page.getByRole('button', { name: /clear all/i })).toBeVisible({ timeout: 5_000 })
  })

  test('the download endpoint returns a zip attachment (no external redirect)', async ({
    page,
    request,
  }) => {
    await page.goto('/compositions')
    const card = page.locator('[data-testid="composition-card"]').first()
    await expect(card).toBeVisible()

    const slug = await card.evaluate((el) => el.closest('[id]')?.id ?? null)
    test.skip(!slug, 'no seeded composition to exercise the download endpoint')

    const res = await request.get(`/api/composition/download/${slug}`, { maxRedirects: 0 })
    // 200 with a real zip when the Shopify Files URLs resolve; 502 if the
    // seeded asset URLs are placeholders. Either way it must NOT redirect off-site.
    expect([200, 502]).toContain(res.status())
    if (res.status() === 200) {
      expect(res.headers()['content-type']).toContain('application/zip')
      expect(res.headers()['content-disposition']).toContain('attachment')
    }
  })
})

test.describe('compositions filter state stays in sync with the URL', () => {
  test('Clear all resets every control and returns to a bare /compositions', async ({ page }) => {
    await page.goto('/compositions?search=gunna&range=30d&sort=oldest&tags=melodic')

    await expect(page.getByLabel('Search loops')).toHaveValue('gunna')
    await expect(page.getByText('Last 30 days')).toBeVisible()
    await expect(page.getByRole('button', { name: /clear all/i })).toBeVisible()

    await page.getByRole('button', { name: /clear all/i }).click()

    await expect(page).toHaveURL(/\/compositions$/)
    await expect(page.getByLabel('Search loops')).toHaveValue('')
    await expect(page.getByText('All time')).toBeVisible()
    await expect(page.getByRole('button', { name: /clear all/i })).toHaveCount(0)
  })
})
