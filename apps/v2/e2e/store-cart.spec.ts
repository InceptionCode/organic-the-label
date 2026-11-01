import type { Page } from '@playwright/test'
import { expect, serverFnName, test, waitForHydration } from './support/fixtures'

// Store filters, product page, cart drawer and checkout, against the dev Shopify store. Carts made
// here are left in Shopify (they expire on their own). Checkout stops at the redirect: the
// navigation to the Shopify host is aborted, so nothing is ever paid.

const PRODUCT = { handle: 'wave-pack', title: 'Wave Pack' }

const cartIcon = (page: Page) => page.getByTestId('cart-icon')
const drawer = (page: Page) => page.getByRole('dialog', { name: 'Cart' })

/** Opens the drawer unless an add-to-cart already opened it. */
async function openCart(page: Page) {
  if (!(await drawer(page).isVisible())) await cartIcon(page).click({ timeout: 5_000 }).catch(() => {})
  await expect(drawer(page)).toBeVisible()
}

/** The product page's own Add to cart (related product cards have their own). */
const mainAddToCart = (page: Page) => page.getByRole('button', { name: 'Add to cart', exact: true })

async function addFromProductPage(page: Page) {
  await page.goto(`/store/${PRODUCT.handle}`)
  await waitForHydration(page)
  await mainAddToCart(page).click()
  await expect(cartIcon(page)).toHaveAttribute('aria-label', /Cart has \d+ items?/)
}

test.describe('store filters', () => {
  test('category, tags, exclusive, sort and search live in the URL', async ({ page }) => {
    await page.goto('/store')
    await waitForHydration(page)

    await page.getByRole('group', { name: 'Category' }).getByRole('button', { name: 'Kits' }).click()
    await expect(page).toHaveURL(/[?&]category=kit(&|$)/)
    await expect(page.getByRole('button', { name: 'Kits' })).toHaveAttribute('aria-pressed', 'true')

    await page.getByRole('combobox', { name: 'Sort by' }).selectOption('price-low')
    await expect(page).toHaveURL(/[?&]sort=price-low(&|$)/)

    await page.getByRole('switch', { name: 'Exclusive' }).click()
    await expect(page).toHaveURL(/[?&]exclusive=true(&|$)/)
    await page.getByRole('switch', { name: 'Exclusive' }).click()
    await expect(page).not.toHaveURL(/exclusive=/)

    await page.getByRole('button', { name: 'Tags' }).click()
    await page.getByRole('checkbox', { name: 'Melodic' }).check()
    await expect(page).toHaveURL(/[?&]tags=melodic(&|$)/)
    await page.keyboard.press('Escape')

    const box = page.getByRole('searchbox', { name: 'Search products' }).locator('visible=true')
    await box.fill('wave')
    await box.press('Enter')
    await expect(page).toHaveURL(/[?&]search=wave(&|$)/)
    await expect(page.getByTestId('product-card')).toHaveCount(1)
    await expect(page.getByTestId('product-card')).toContainText(PRODUCT.title)
  })

  test('quick consecutive toggles both apply (no stale filter state while loading)', async ({ page }) => {
    await page.goto('/store')
    await waitForHydration(page)
    const exclusive = page.getByRole('switch', { name: 'Exclusive' })
    await exclusive.click()
    await exclusive.click()
    await expect(page).toHaveURL(/\/store$/)
    await expect(exclusive).toHaveAttribute('aria-checked', 'false')

    await page.getByRole('button', { name: 'Tags' }).click()
    await page.getByRole('checkbox', { name: 'Melodic' }).check()
    await page.getByRole('checkbox', { name: 'Trap' }).check()
    await expect(page).toHaveURL(/[?&]tags=melodic%2Ctrap(&|$)|[?&]tags=melodic,trap(&|$)/)
  })

  test('back and forward restore filters', async ({ page }) => {
    await page.goto('/store')
    await waitForHydration(page)
    await page.getByRole('group', { name: 'Category' }).getByRole('button', { name: 'Kits' }).click()
    await expect(page).toHaveURL(/category=kit/)
    await page.getByRole('group', { name: 'Category' }).getByRole('button', { name: 'Sound Banks' }).click()
    await expect(page).toHaveURL(/category=bank/)

    await page.goBack()
    await expect(page).toHaveURL(/category=kit/)
    await expect(page.getByRole('button', { name: 'Kits' })).toHaveAttribute('aria-pressed', 'true')
    await page.goBack()
    await expect(page).toHaveURL(/\/store$/)
    await expect(page.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
    await page.goForward()
    await expect(page).toHaveURL(/category=kit/)
  })

  test('URL filters render server side, unknown values are dropped', async ({ page }) => {
    const res = await page.goto('/store?category=bank&tags=free,NOT-A-TAG&sort=bogus')
    expect(res?.status()).toBe(200)
    await expect(page.getByRole('button', { name: 'Sound Banks' })).toHaveAttribute('aria-pressed', 'true')
    for (const card of await page.getByTestId('product-card').all()) await expect(card).toContainText(/Bank/)
  })

  test('pagination: a cursor shows Previous page and still renders (dev catalog fits one page)', async ({ page }) => {
    // The dev store has fewer products than one page, so "Next page" never shows here. The cursor
    // round trip and page size are covered by unit tests (store-search, shopify-parse).
    const res = await page.goto('/store?after=e2e-invalid-cursor')
    expect(res?.status()).toBe(200)
    await expect(page.getByRole('link', { name: 'Previous page' }).or(page.getByText('Failed to load products'))).toBeVisible()
  })

  test('product card play: one preview at a time', async ({ page }) => {
    await page.goto('/store')
    await waitForHydration(page)
    const first = page.getByRole('button', { name: /^(Play|Pause) Wave Pack preview$/ })
    const second = page.getByRole('button', { name: /^(Play|Pause) Organic Sonics - Raw Pack preview$/ })
    await first.click()
    await expect(first).toHaveAttribute('aria-pressed', 'true')
    await second.click()
    await expect(second).toHaveAttribute('aria-pressed', 'true')
    await expect(first).toHaveAttribute('aria-pressed', 'false')
  })

  test('the sticky product bar is absent on /store', async ({ page }) => {
    await page.goto('/store')
    await waitForHydration(page)
    await expect(page.getByTestId('sticky-product-bar')).toHaveCount(0)
  })
})

test.describe('product page and cart @smoke', () => {
  test('quantity, add to cart, drawer update, remove, empty state', async ({ page }) => {
    await page.goto(`/store/${PRODUCT.handle}`)
    await waitForHydration(page)
    await expect(page.getByRole('heading', { level: 1, name: PRODUCT.title })).toBeVisible()

    // Quantity stepper on the product page.
    const quantity = page.getByRole('group', { name: 'Quantity' })
    await quantity.getByTestId('qty-increase').click()
    await expect(quantity.getByRole('status')).toHaveText('2')
    await quantity.getByTestId('qty-decrease').click()
    await expect(quantity.getByRole('status')).toHaveText('1')

    await mainAddToCart(page).click()
    await expect(cartIcon(page)).toHaveAttribute('aria-label', /Cart has \d+ items?/)
    await openCart(page)
    const row = drawer(page).getByTestId('cart-item').filter({ hasText: PRODUCT.title })
    await expect(row).toBeVisible()

    // Quantity in the drawer.
    await row.getByTestId('qty-increase').click()
    await expect(row.getByRole('status')).toHaveText('2')
    await expect(drawer(page).getByTestId('checkout-btn')).toBeEnabled()

    // Remove every line: the empty state links back to the store.
    for (const item of await drawer(page).getByTestId('cart-item').all()) {
      await item.getByTestId('qty-remove').click()
    }
    await expect(drawer(page).getByText('Your cart is empty.')).toBeVisible()
    await drawer(page).getByRole('link', { name: 'Browse the store' }).click()
    await expect(page).toHaveURL(/\/store$/)
    await expect(drawer(page)).toBeHidden()
  })

  test('the cart persists across a reload (cartId cookie)', async ({ page, context }) => {
    await addFromProductPage(page)
    const cookie = (await context.cookies()).find((c) => c.name === 'cartId')
    expect(cookie?.httpOnly).toBe(true)
    await page.reload()
    await waitForHydration(page)
    await expect(cartIcon(page)).toHaveAttribute('aria-label', /Cart has \d+ items?/)
    await openCart(page)
    await expect(drawer(page).getByTestId('cart-item').filter({ hasText: PRODUCT.title })).toBeVisible()
  })

  test('checkout redirects to the Shopify checkout host (stopped before payment)', async ({ page }) => {
    await addFromProductPage(page)
    await openCart(page)
    const checkout = drawer(page).getByTestId('checkout-btn')
    const href = await checkout.getAttribute('href')
    expect(href).toBeTruthy()
    const target = new URL(href!)
    expect(target.protocol).toBe('https:')
    expect(target.host).not.toContain('localhost')

    // Abort the navigation to Shopify: the test only proves the redirect target.
    await page.route((url) => url.host === target.host, (route) => route.abort())
    const [request] = await Promise.all([
      page.waitForRequest((req) => new URL(req.url()).host === target.host && req.isNavigationRequest()),
      checkout.click(),
    ])
    expect(request.url()).toContain(target.pathname)
  })

  test('product audio tracklist lists every preview and plays one', async ({ page }) => {
    await page.goto(`/store/${PRODUCT.handle}`)
    await waitForHydration(page)
    const previews = page.getByRole('region', { name: 'PREVIEWS' })
    const rows = previews.getByRole('listitem')
    const count = await rows.count()
    expect(count).toBeGreaterThan(1)
    await expect(previews.getByText(`${count} tracks`)).toBeVisible()
    const second = rows.nth(1).getByRole('button')
    // The row's name is its content: a screen-reader-only Play/Pause, then the visible title.
    const title = (await second.locator('span.truncate').textContent())!.replace(/^(Play|Pause)\s*/, '').trim()
    await expect(second).toHaveAccessibleName(`Play ${title}`)
    await second.click()
    // The main player switches to that track (actual audio output is not asserted headless).
    await expect(previews.getByRole('slider', { name: `Seek ${title}` })).toBeVisible()
  })

  test('license selection: no beat with licenses in the dev catalog (skipped)', async () => {
    test.skip(true, 'The dev store has no beat with license variants. LicenseOptions is exercised once one exists.')
  })
})

test.describe('home hero playlist', () => {
  test('no product request before play, exactly one on play', async ({ page }) => {
    const productCalls: string[] = []
    page.on('request', (req) => {
      if (serverFnName(req.url()) === 'getProductFn') productCalls.push(req.url())
    })
    await page.goto('/')
    await waitForHydration(page)
    await page.waitForLoadState('networkidle')
    expect(productCalls).toHaveLength(0)

    await page.getByRole('button', { name: /^Play .* preview$/ }).first().click()
    await expect.poll(() => productCalls.length).toBe(1)
    await page.waitForTimeout(1000)
    expect(productCalls).toHaveLength(1)
  })
})
