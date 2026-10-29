import type { Page } from '@playwright/test'
import { admin, contactByEmail, testUserId } from './support/admin'
import { productGid } from './support/env'
import { E2E_USER_EMAIL, expect, forEmail, test, waitForHydration } from './support/fixtures'

// Signed-in account flows for the dedicated test user. One manual entitlement for a real dev
// product is seeded per test that needs it and deleted afterwards; preferences are reset and the
// test user's email_contacts row is deleted after the newsletter test (teardown repeats both).

const PRODUCT = { handle: 'wave-pack', title: 'Wave Pack' }

async function seedEntitlement(): Promise<string> {
  const userId = await testUserId()
  const product_gid = await productGid(PRODUCT.handle)
  await admin().from('entitlements').delete().eq('user_id', userId).eq('product_gid', product_gid)
  const { data, error } = await admin()
    .from('entitlements')
    .insert({ user_id: userId, product_gid, source: 'manual' })
    .select('id')
    .single()
  if (error || !data) throw new Error(`seeding the entitlement failed: ${error?.message}`)
  return (data as { id: string }).id
}

const deleteEntitlement = (id: string) => admin().from('entitlements').delete().eq('id', id)

async function gotoAccount(page: Page) {
  await page.goto('/account')
  await waitForHydration(page)
  await expect(page.getByRole('heading', { name: 'Your library' })).toBeVisible()
}

test.describe('library and owned state @smoke', () => {
  let entitlementId: string | null = null
  test.afterEach(async () => {
    if (entitlementId) await deleteEntitlement(entitlementId)
    entitlementId = null
  })

  test('a seeded entitlement shows in the library, as Owned on store and product, with Request access', async ({ page, signIn }) => {
    entitlementId = await seedEntitlement()
    await signIn()

    await gotoAccount(page)
    const library = page.getByTestId('account-library')
    await expect(library.getByText(PRODUCT.title)).toBeVisible()

    // Store card: Owned badge and Request access instead of Add to cart.
    await page.goto('/store')
    await waitForHydration(page)
    const card = page.getByTestId('product-card').filter({ hasText: PRODUCT.title })
    await expect(card.getByText('Owned', { exact: true })).toBeVisible()
    await expect(card.getByRole('link', { name: `Request access to ${PRODUCT.title}` })).toBeVisible()
    await expect(card.getByRole('button', { name: `Add to cart : ${PRODUCT.title}` })).toHaveCount(0)

    // Product page: the owned panel replaces the purchase panel.
    await page.goto(`/store/${PRODUCT.handle}`)
    await waitForHydration(page)
    const owned = page.getByTestId('owned-purchase')
    await expect(owned).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add to cart', exact: true })).toHaveCount(0)

    // Request access opens /contact prefilled for a download issue.
    await owned.getByRole('link', { name: `Request access to ${PRODUCT.title}` }).click()
    await expect(page).toHaveURL(/\/contact\?/)
    await expect(page.getByRole('combobox', { name: 'Category (required)' })).toHaveValue('download_issue')
    await expect(page.getByRole('textbox', { name: 'Subject (optional)' })).toHaveValue(`Access request: ${PRODUCT.title}`)
    await expect(page.getByRole('textbox', { name: 'Message (required)' })).toHaveValue(new RegExp(`I purchased ${PRODUCT.title}`))
    await expect(page.getByRole('textbox', { name: 'Email (required)' })).toHaveValue(E2E_USER_EMAIL)
  })

  test('cache safety: an anonymous page gains owned badges after sign-in and loses them after sign-out', async ({ page, signIn }) => {
    entitlementId = await seedEntitlement()

    // Anonymous HTML: no owned state anywhere.
    await page.goto('/store')
    await waitForHydration(page)
    const card = page.getByTestId('product-card').filter({ hasText: PRODUCT.title })
    await expect(card.getByText('Owned', { exact: true })).toHaveCount(0)

    await signIn()
    await page.goto('/store')
    await waitForHydration(page)
    await expect(card.getByText('Owned', { exact: true })).toBeVisible()

    await page.goto('/account')
    await waitForHydration(page)
    await page.getByTestId('sign-out-button').click()
    await expect(page).toHaveURL(/\/$/)
    await page.goto('/store')
    await waitForHydration(page)
    await expect(card.getByText('Owned', { exact: true })).toHaveCount(0)
  })

  test('cache safety: a second browser (another visitor) never sees the signed-in user data', async ({ page, signIn, browser }) => {
    entitlementId = await seedEntitlement()
    await signIn()
    await page.goto('/store')
    await expect(page.getByTestId('product-card').filter({ hasText: PRODUCT.title }).getByText('Owned', { exact: true })).toBeVisible()

    const other = await browser.newContext()
    try {
      const anon = await other.newPage()
      const res = await anon.goto('/store')
      expect(res?.status()).toBe(200)
      await waitForHydration(anon)
      await expect(anon.getByTestId('sign-in-link')).toBeVisible()
      await expect(anon.getByText('Owned', { exact: true })).toHaveCount(0)
      const html = await (await anon.request.get('/explore')).text()
      expect(html).not.toContain(E2E_USER_EMAIL)
      expect(html).not.toContain('Welcome back')
      // Private server fns answer 401 without a session.
      await anon.goto('/account')
      await expect(anon).toHaveURL(/\/login/)
    } finally {
      await other.close()
    }
  })

  test('signed-in responses are never publicly cacheable', async ({ page, signIn }) => {
    await signIn()
    for (const path of ['/explore', '/store', '/account']) {
      const res = await page.request.get(path)
      const cacheControl = res.headers()['cache-control'] ?? ''
      expect(cacheControl, path).not.toMatch(/public|s-maxage/)
    }
  })
})

test.describe('preferences', () => {
  test.afterEach(async () => {
    const userId = await testUserId()
    await admin()
      .from('user_preferences')
      .update({ favorite_genres: [], favorite_product_types: [], marketing_opt_in: false, personalization_opt_in: false })
      .eq('user_id', userId)
  })

  test('genres save and survive a reload', async ({ page, signIn }) => {
    await signIn()
    await gotoAccount(page)
    const genres = page.getByRole('group', { name: 'Genres' })
    await genres.getByRole('checkbox', { name: 'Melodic' }).check()
    await genres.getByRole('checkbox', { name: 'Trap' }).check()
    await page.getByRole('button', { name: 'Save preferences' }).click()
    await expect(page.getByText('Preferences saved.')).toBeVisible()

    await page.reload()
    await waitForHydration(page)
    await expect(page.getByRole('group', { name: 'Genres' }).getByRole('checkbox', { name: 'Melodic' })).toBeChecked()
    const { data } = await admin().from('user_preferences').select('favorite_genres').eq('user_id', await testUserId()).single()
    expect([...(data as { favorite_genres: string[] }).favorite_genres].sort()).toEqual(['melodic', 'trap'])
  })

  test('newsletter checkbox is two-way: subscribe then unsubscribe, both recorded', async ({ page, signIn, sandbox, cleanupEmails }) => {
    cleanupEmails.push(E2E_USER_EMAIL)
    await admin().from('email_contacts').delete().eq('email', E2E_USER_EMAIL)
    await signIn()
    await gotoAccount(page)
    const box = page.getByRole('checkbox', { name: /Email me about new drops and offers/ })
    await expect(box).toBeEnabled()
    await expect(box).not.toBeChecked()

    let mark = await sandbox.mark()
    await box.check()
    await page.getByRole('button', { name: 'Save preferences' }).click()
    await expect(page.getByText("Preferences saved. You're on the newsletter.")).toBeVisible()
    const [upsert] = await sandbox.waitFor(mark, (c) => c.service === 'mailerlite' && forEmail(E2E_USER_EMAIL)(c))
    expect(upsert!.action).toBe('upsert')
    expect(upsert!.payload.resubscribe).toBe(true)
    expect(await contactByEmail(E2E_USER_EMAIL)).toMatchObject({ status: 'subscribed', marketing_opt_in: true })

    mark = await sandbox.mark()
    await page.getByRole('checkbox', { name: /Email me about new drops and offers/ }).uncheck()
    await page.getByRole('button', { name: 'Save preferences' }).click()
    await expect(page.getByText("Preferences saved. You're unsubscribed from the newsletter.")).toBeVisible()
    const [unsub] = await sandbox.waitFor(mark, (c) => c.service === 'mailerlite' && forEmail(E2E_USER_EMAIL)(c))
    expect(unsub!.action).toBe('unsubscribe')
    expect(await contactByEmail(E2E_USER_EMAIL)).toMatchObject({ status: 'unsubscribed', marketing_opt_in: false })

    // Saving again without a change makes no MailerLite call.
    mark = await sandbox.mark()
    await page.getByRole('button', { name: 'Save preferences' }).click()
    await expect(page.getByText('Preferences saved.', { exact: true })).toBeVisible()
    expect(await sandbox.since(mark, (c) => c.service === 'mailerlite')).toHaveLength(0)
  })
})
