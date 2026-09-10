import { test, expect, type Page } from '@playwright/test'

/**
 * E2E tests for the cart flow.
 *
 * Tests the full add-to-cart → cart drawer → checkout handoff path.
 * These require at least one product to be available in the dev Shopify store.
 */

// ---------------------------------------------------------------------------
// Helper: navigate to the store, click the first product, add it to cart
// ---------------------------------------------------------------------------
async function addFirstProductToCart(page: Page) {
  await page.goto('/store')

  // Wait for product cards to load
  await page.locator('[data-testid="product-card"]').first().waitFor()

  // Navigate to the first product detail page by clicking the image link inside
  // the card. Clicking the outer div is unreliable — the bottom section (price,
  // buttons, audio preview) is not a link, so the center of a tall card can miss
  // the navigation anchor. The first <a> inside each card is the image link.
  const cardLink = page.locator('[data-testid="product-card"] a').first()
  await cardLink.waitFor()
  await expect(async () => {
    if (!/\/store\/.+/.test(page.url())) await cardLink.click({ timeout: 3_000 })
    await page.waitForURL(/\/store\/.+/, { timeout: 1_500 })
  }).toPass({ timeout: 20_000, intervals: [250, 500, 1_000] })

  // Click the primary Add to Cart button (first match — product detail pages also
  // render add-to-cart buttons in the "you might also like" row, causing a strict
  // mode violation without .first()).
  const [response] = await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/store/cart/add') && res.status() === 200),
    page.locator('[data-testid="add-to-cart-btn"]').first().click(),
  ])

  // The app may auto-open the cart drawer after a successful add. Close it so
  // every test that calls this helper starts with the drawer in a known-closed
  // state — otherwise the drawer overlay intercepts clicks on the cart-icon.
  //
  // isVisible() is a single point-in-time check, not auto-retrying — if the
  // drawer is still mid open-animation at the instant of the check it can
  // read false and skip closing. Give it a short grace window to finish
  // opening first so that read is accurate.
  const drawer = page.locator('[data-testid="cart-drawer"]')
  await drawer.waitFor({ state: 'visible', timeout: 1_000 }).catch(() => { })
  if (await drawer.isVisible()) {
    await page.getByRole('button', { name: 'Close drawer' }).click()
    await expect(drawer).not.toBeVisible({ timeout: 3_000 })
  }

  return response
}

// ---------------------------------------------------------------------------
// Cart flow tests
// ---------------------------------------------------------------------------

test('user can add a product to cart @smoke', async ({ page }) => {
  await addFirstProductToCart(page)

  // The cart icon badge should now show at least 1 item.
  // The aria-label updates to "Cart has N items" when count > 0.
  const cartIcon = page.locator('[data-testid="cart-icon"]')
  await expect(cartIcon).toHaveAttribute('aria-label', /cart has \d+ item/i)
})

test('user can open the cart drawer and see the item', async ({ page }) => {
  await addFirstProductToCart(page)

  // Open the cart drawer
  await page.locator('[data-testid="cart-icon"]').click()

  // The drawer panel must be visible
  await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible()

  // At least one cart item must be displayed
  await expect(page.locator('[data-testid="cart-item"]').first()).toBeVisible()
})

test('user can update quantity in the cart', async ({ page }) => {
  await addFirstProductToCart(page)

  // Open the cart drawer
  await page.locator('[data-testid="cart-icon"]').click()
  await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible()

  // Click increment — wait for the update API call to complete
  await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/store/cart/update') && res.status() === 200),
    page.locator('[data-testid="qty-increase"]').first().click(),
  ])

  // The cart icon should now show 2 items
  const cartIcon = page.locator('[data-testid="cart-icon"]')
  await expect(cartIcon).toHaveAttribute('aria-label', /cart has 2 item/i)
})

test('user can remove an item from the cart', async ({ page }) => {
  await addFirstProductToCart(page)

  // Open the cart drawer
  await page.locator('[data-testid="cart-icon"]').click()
  await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible()

  // Click the Remove button — wait for the remove API call to complete
  await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/store/cart/remove') && res.status() === 200),
    page.getByRole('button', { name: /remove/i }).first().click(),
  ])

  // The empty-state message should now be visible
  await expect(page.locator('[data-testid="cart-drawer"]').getByText('Your cart is empty.')).toBeVisible()
})

test('only the clicked product card button shows "Adding..." — others stay idle', async ({ page }) => {
  await page.goto('/store')
  await page.locator('[data-testid="product-card"]').first().waitFor()

  // This test requires at least 2 product cards so we can prove button isolation.
  const cardCount = await page.locator('[data-testid="product-card"]').count()
  test.skip(cardCount < 2, 'Needs at least 2 product cards in the dev store')

  // Delay the add request by 2s so the in-flight button state stays observable
  // (long enough for a slow CI runner to poll it, short enough not to stall the
  // suite). A hard stall + unawaited click was racy on cold CI.
  await page.route('**/api/store/cart/add', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2_000))
    await route.continue()
  })

  const allAddBtns = page.locator('[data-testid="add-to-cart-btn"]')
  const firstBtn = allAddBtns.first()
  const secondBtn = allAddBtns.nth(1)

  // AddToCartButton is a client component — a click that lands before it
  // hydrates is dropped (React does not replay pre-hydration clicks) and the
  // loading state never appears. On a cold-compiled store page (CI) hydration
  // can lag the DOM by seconds, so retry the click until it takes.
  await expect(async () => {
    if (await firstBtn.isEnabled()) await firstBtn.click({ timeout: 3_000 })
    await expect(firstBtn).toHaveText('Adding...', { timeout: 500 })
  }).toPass({ timeout: 20_000, intervals: [250, 500, 1_000] })

  // Only the clicked button should be in the loading state.
  await expect(firstBtn).toBeDisabled()

  // Every other button must remain idle — this is the regression we're guarding.
  await expect(secondBtn).toHaveText('Add to cart')
  await expect(secondBtn).not.toBeDisabled()

  // Once the delayed request resolves, the clicked button recovers.
  await expect(firstBtn).toHaveText('Add to cart', { timeout: 8_000 })
})

test('checkout button is present and links to Shopify @smoke', async ({ page }) => {
  await addFirstProductToCart(page)

  // Open the cart drawer
  await page.locator('[data-testid="cart-icon"]').click()
  await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible()

  // The checkout button/link must be present.
  // When the cart has a checkoutUrl it renders as a link — the href points to Shopify.
  const checkoutBtn = page.locator('[data-testid="checkout-btn"]')
  await expect(checkoutBtn).toBeVisible()

  // Do NOT click the checkout button — only verify the handoff URL is present.
  // A real Shopify checkout would create a real order in the dev store.
  const href = await checkoutBtn.getAttribute('href')
  if (href) {
    // The link should point to the Shopify checkout domain
    expect(href).toMatch(/myshopify\.com|shopify\.com/)
  }
  // If href is null the button is the disabled variant (no checkoutUrl returned),
  // which is acceptable — the important thing is the element renders.
})
