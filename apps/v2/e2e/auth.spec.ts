import { randomBytes } from 'node:crypto'
import { E2E_USERNAME, generateTokenHash } from './support/admin'
import { HCAPTCHA_TEST_TOKEN } from './support/hcaptcha-stub'
import { E2E_USER_EMAIL, expect, serverFnName, test, waitForHydration } from './support/fixtures'
import { IS_LOCAL_SANDBOX } from './support/env'
import type { Page, Request } from '@playwright/test'

// Auth. END TO END: magic-link confirm (admin generateLink, no email), sign out, the recovery link
// through /auth/confirm to /login/reset-password and setting a new password, and the route guards.
// NOT END TO END: password sign-in, sign-up, magic-link request and reset request. Supabase sends
// those emails itself and verifies hCaptcha with its real secret, so these specs check the client
// validation and that the final server fn request is made with the right payload, then abort it in
// the browser before it reaches Supabase.

test.describe('magic link and session @smoke', () => {
  test('confirm signs in, lands on /explore with the greeting, navbar shows Account', async ({ page, signIn }) => {
    await signIn()
    await expect(page.getByRole('heading', { level: 1, name: 'EXPLORE' })).toBeVisible()
    await expect(page.getByText(`Welcome back, ${E2E_USERNAME}`)).toBeVisible()
    await waitForHydration(page)
    await expect(page.getByTestId('account-link')).toBeVisible()
  })

  test('an invalid or used token shows the expired page', async ({ page }) => {
    const res = await page.goto('/auth/confirm?token_hash=not-a-real-token&type=magiclink')
    expect(res?.status()).toBe(400)
    await expect(page.getByText('This link has expired or was already used.')).toBeVisible()
  })

  test('sign out from the account page clears the session', async ({ page, signIn }) => {
    await signIn()
    await page.goto('/account')
    await waitForHydration(page)
    await page.getByTestId('sign-out-button').click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByTestId('sign-in-link')).toBeVisible()
    await page.goto('/account')
    await expect(page).toHaveURL(/\/login\?redirect=%2Faccount$/)
  })
})

test.describe('password recovery', () => {
  test('recovery link lands on /login/reset-password and sets a new password @smoke', async ({ page }) => {
    test.skip(!IS_LOCAL_SANDBOX, 'Uses the dev Supabase project')
    const hash = await generateTokenHash('recovery')
    await page.goto(`/auth/confirm?token_hash=${encodeURIComponent(hash)}&type=recovery`)
    await expect(page).toHaveURL(/\/login\/reset-password$/)
    await waitForHydration(page)

    // Client validation first.
    await page.getByLabel('Password', { exact: true }).fill('short')
    await page.getByLabel('Confirm Password', { exact: true }).fill('short')
    await page.getByRole('button', { name: 'Reset password' }).click()
    await expect(page.getByText('Password must be at least 8 characters long.')).toBeVisible()

    // A random password, never stored: the account keeps working through magic links.
    const password = `E2e${randomBytes(12).toString('base64url')}9`
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.getByLabel('Confirm Password', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Reset password' }).click()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByTestId('sign-in-link')).toBeVisible()

    // The recovery cookie is gone, so the form is no longer reachable.
    await page.goto('/login/reset-password')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('an ordinary session cannot open the reset form', async ({ page, signIn }) => {
    await signIn()
    await page.goto('/login/reset-password')
    // Bounced to /login, which sends a signed-in user on to /explore.
    await expect(page).toHaveURL(/\/explore$/)
    await expect(page.getByRole('heading', { name: 'SET NEW PASSWORD' })).toHaveCount(0)
  })
})

/** Aborts the named server fn call and resolves with its request (never reaches Supabase). */
async function interceptServerFn(page: Page, name: string): Promise<() => Promise<Request>> {
  let resolve!: (r: Request) => void
  const seen = new Promise<Request>((r) => (resolve = r))
  await page.route(/\/_serverFn\//, async (route) => {
    if (serverFnName(route.request().url()) !== name) return route.fallback()
    resolve(route.request())
    await route.abort()
  })
  return () => seen
}

test.describe('auth forms (client side, final request intercepted, NOT end to end)', () => {
  test.skip(!IS_LOCAL_SANDBOX, 'Server fn names are only readable on the dev server')

  test('password sign-in validates, then sends email, password and a captcha token', async ({ page }) => {
    await page.goto('/login')
    await waitForHydration(page)
    const request = await interceptServerFn(page, 'signInWithPasswordFn')

    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await expect(page.getByText('Please enter a valid email')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeFocused()

    await page.getByLabel('Email').fill(E2E_USER_EMAIL)
    await page.getByLabel('Password', { exact: true }).fill('Not-the-real-one-1')
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    const body = (await request()).postData() ?? ''
    expect(body).toContain(E2E_USER_EMAIL)
    expect(body).toContain('Not-the-real-one-1')
    expect(body).toContain(HCAPTCHA_TEST_TOKEN)
    await expect(page.getByRole('alert')).toContainText('Something went wrong')
  })

  test('magic link request validates, then sends the email and a captcha token', async ({ page }) => {
    await page.goto('/login')
    await waitForHydration(page)
    await page.getByRole('button', { name: 'Sign in with magic link' }).click()
    const dialog = page.getByRole('dialog', { name: 'Sign in with magic link' })
    await expect(dialog).toBeVisible()
    const request = await interceptServerFn(page, 'sendMagicLinkFn')

    await dialog.getByLabel('Email').fill('not-an-email')
    await dialog.getByRole('button', { name: 'Send Magic Link' }).click()
    await expect(dialog.getByText('Please enter a valid email')).toBeVisible()

    await dialog.getByLabel('Email').fill(E2E_USER_EMAIL)
    await dialog.getByRole('button', { name: 'Send Magic Link' }).click()
    const body = (await request()).postData() ?? ''
    expect(body).toContain(E2E_USER_EMAIL)
    expect(body).toContain(HCAPTCHA_TEST_TOKEN)
  })

  test('reset request validates, then sends the email and a captcha token', async ({ page }) => {
    await page.goto('/login')
    await waitForHydration(page)
    await page.getByRole('button', { name: 'Forgot password?' }).click()
    const dialog = page.getByRole('dialog', { name: 'Reset Password' })
    await expect(dialog).toBeVisible()
    const request = await interceptServerFn(page, 'requestPasswordResetFn')

    await dialog.getByRole('button', { name: 'Send Reset Link' }).click()
    await expect(dialog.getByText('Please enter a valid email')).toBeVisible()
    await dialog.getByLabel('Email').fill(E2E_USER_EMAIL)
    await dialog.getByRole('button', { name: 'Send Reset Link' }).click()
    const body = (await request()).postData() ?? ''
    expect(body).toContain(E2E_USER_EMAIL)
    expect(body).toContain(HCAPTCHA_TEST_TOKEN)
  })

  test('sign-up validates fields, needs the captcha, then sends the payload', async ({ page }) => {
    await page.goto('/signup')
    await waitForHydration(page)
    const request = await interceptServerFn(page, 'signUpFn')
    const submit = page.getByRole('button', { name: 'Create account' })

    await page.getByLabel('Username').fill('bad name!')
    await page.getByLabel('Email').fill('e2e+signup@organicsonics.com')
    await page.getByLabel('Password', { exact: true }).fill('nocaps123')
    await page.getByLabel('Confirm Password', { exact: true }).fill('different')
    await page.getByLabel('Confirm Password', { exact: true }).blur()
    await expect(page.getByText('Username must NOT contain special characters')).toBeVisible()
    await expect(page.getByText('Password must contain capital letter and a number.')).toBeVisible()
    await expect(page.getByText('Password and confirm password must match')).toBeVisible()
    await expect(submit).toBeDisabled()

    await page.getByLabel('Username').fill('e2e_signup')
    await page.getByLabel('Password', { exact: true }).fill('Valid-pass-123')
    await page.getByLabel('Confirm Password', { exact: true }).fill('Valid-pass-123')
    await page.getByTestId('hcaptcha-stub').click()
    await expect(submit).toBeEnabled()
    await submit.click()
    const body = (await request()).postData() ?? ''
    expect(body).toContain('e2e+signup@organicsonics.com')
    expect(body).toContain('e2e_signup')
    expect(body).toContain(HCAPTCHA_TEST_TOKEN)
  })
})
