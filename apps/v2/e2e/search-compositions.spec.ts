import { expect, test, waitForHydration } from './support/fixtures'

// Site search and the /compositions loops page against the dev catalog and dev Supabase rows.
// Loop downloads write composition_downloads rows keyed by this browser's anon_token; the visitor
// cleanup fixture deletes them after each test.

const LEGACY_LOOP = 'late-night' // audio + terms, zipped on the fly
const BUNDLE_LOOP = 'what-we-doing' // has a bundle_url, answered with a 302

test.describe('search', () => {
  test('query, type tabs, clear and the no results state @smoke', async ({ page }) => {
    await page.goto('/search')
    await waitForHydration(page)
    const box = page.getByRole('searchbox', { name: 'Search' })
    await box.fill('wave')
    await page.getByRole('button', { name: 'Search', exact: true }).click()
    await expect(page).toHaveURL(/\/search\?q=wave$/)
    await expect(page.getByRole('region', { name: 'Products' }).getByRole('link', { name: 'Wave Pack' })).toBeVisible()

    const tabs = page.getByRole('navigation', { name: 'Result type' })
    await tabs.getByRole('link', { name: /^Compositions/ }).click()
    await expect(page).toHaveURL(/type=compositions/)
    await expect(page.getByRole('region', { name: 'Products' })).toHaveCount(0)
    await tabs.getByRole('link', { name: /^Products/ }).click()
    await expect(page).toHaveURL(/type=products/)
    await expect(page.getByRole('region', { name: 'Products' })).toBeVisible()

    await page.getByRole('button', { name: 'Clear search' }).click()
    await expect(page).toHaveURL(/\/search$/)
    await expect(box).toHaveValue('')

    await page.goto('/search?q=zzqqxx-no-such-thing-e2e')
    await expect(page.getByRole('heading', { name: 'No results' })).toBeVisible()
  })

  test('compositions results and the type filter render from the URL', async ({ page }) => {
    const res = await page.goto('/search?q=late&type=compositions')
    expect(res?.status()).toBe(200)
    await expect(page.getByRole('heading', { name: 'Late Night' })).toBeVisible()
  })
})

test.describe('compositions', () => {
  test('filters live in the URL and narrow the list', async ({ page }) => {
    await page.goto('/compositions')
    await waitForHydration(page)
    const all = await page.getByTestId('composition-row').or(page.getByTestId('composition-card')).count()
    expect(all).toBeGreaterThan(1)

    await page.getByRole('combobox', { name: 'Sort' }).selectOption('oldest')
    await expect(page).toHaveURL(/sort=oldest/)
    await page.getByRole('combobox', { name: 'Date range' }).selectOption('year')
    await expect(page).toHaveURL(/range=year/)

    const search = page.getByRole('searchbox', { name: 'Search loops' }).locator('visible=true')
    await search.fill('Late Night')
    await search.press('Enter')
    await expect(page).toHaveURL(/search=Late/)
    await expect(page.getByRole('heading', { level: 2, name: 'Late Night' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Top Line' })).toHaveCount(0)
  })

  test('watch selects the video panel; playing a loop selects it too', async ({ page }) => {
    await page.goto('/compositions')
    await waitForHydration(page)
    const video = page.getByRole('complementary', { name: 'Video' })

    await page.getByRole('button', { name: /^Watch on .*: Top Line$/ }).click()
    await expect(page.getByRole('button', { name: /^Watching on .*: Top Line$/ })).toHaveAttribute('aria-expanded', 'true')
    await expect(video.getByText('Top Line', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Play Late Night' }).click()
    await expect(page.getByRole('button', { name: /^(Play|Pause) Late Night$/ })).toHaveAttribute('aria-pressed', 'true')
    await expect(video.getByText('Late Night', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Watching on .*: Late Night$/ })).toBeVisible()
  })

  test('Download loop saves a zip @smoke', async ({ page }) => {
    await page.goto(`/compositions?search=Late%20Night`)
    await waitForHydration(page)
    const row = page.locator('article').filter({ has: page.getByRole('heading', { level: 2, name: 'Late Night' }) })
    const [download] = await Promise.all([page.waitForEvent('download'), row.getByRole('button', { name: 'Download loop' }).click()])
    expect(download.suggestedFilename()).toBe(`${LEGACY_LOOP}.zip`)
  })

  test('download route: zip, redirect, 404s and headers', async ({ request }) => {
    const zip = await request.get(`/compositions/download/${LEGACY_LOOP}`)
    expect(zip.status()).toBe(200)
    expect(zip.headers()['content-type']).toBe('application/zip')
    expect(zip.headers()['content-disposition']).toBe(`attachment; filename="${LEGACY_LOOP}.zip"`)
    expect(zip.headers()['cache-control']).toBe('private, no-store')
    const bytes = await zip.body()
    expect(bytes.subarray(0, 4).toString('hex')).toBe('504b0304') // local file header "PK\x03\x04"

    const bundle = await request.get(`/compositions/download/${BUNDLE_LOOP}`, { maxRedirects: 0 })
    expect(bundle.status()).toBe(302)
    expect(bundle.headers()['location']).toMatch(/^https:\/\//)

    for (const slug of ['no-such-loop-e2e', '..%2F..%2Fetc%2Fpasswd', 'UPPER-case', '%00']) {
      const res = await request.get(`/compositions/download/${slug}`, { maxRedirects: 0 })
      expect(res.status(), slug).toBe(404)
    }
  })
})
