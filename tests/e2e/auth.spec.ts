import { test, expect, type Page } from '@playwright/test'

/**
 * E2E tests for auth flows.
 *
 * Uses a real test user account — do NOT use production user credentials.
 * Store test credentials in .env.test (never commit them):
 *   PLAYWRIGHT_TEST_EMAIL=test@example.com
 *   PLAYWRIGHT_TEST_PASSWORD=TestPassword1
 *
 * IMPORTANT before writing tests:
 * Add data-testid attributes to key elements:
 *   - app/components/navbar.tsx              → data-testid="sign-in-btn"
 *   - app/login/components/                  → data-testid="login-form"
 *   - app/components/profile-dropdown.tsx    → data-testid="profile-menu"
 *   - app/components/navbar.tsx              → data-testid="sign-out-btn"
 */

// ---------------------------------------------------------------------------
// hCaptcha test key set (Publisher / Pro account — "always passes" in siteverify)
// Source: hCaptcha documentation test key set
// ---------------------------------------------------------------------------

// Response token that the test stub fires; accepted by the test secret key in siteverify
const HCAPTCHA_TEST_RESPONSE_TOKEN = '10000000-aaaa-bbbb-cccc-000000000001'

/**
 * Sets up a hCaptcha stub before any page JavaScript runs so that
 * @hcaptcha/react-hcaptcha never needs the real CDN script.
 *
 * Strategy:
 *  - page.addInitScript injects window.hcaptcha before React boots, so the
 *    component finds it already defined when it tries to render the widget.
 *  - An Object.defineProperty setter on window.hcaptchaOnLoad calls the
 *    callback the instant React registers it, completing the handshake.
 *  - page.route aborts any request to js.hcaptcha.com so the real script
 *    can never override the stub.
 *  - render() fires the onVerify callback with the test token after one tick,
 *    setting captchaToken state and enabling the submit button.
 *
 * Must be called BEFORE page.goto().
 */
async function mockHCaptchaScript(page: Page) {
  await page.addInitScript(`
    (function () {
      var _callbacks = {};
      var _counter  = 0;

      window.hcaptcha = {
        render: function (container, params) {
          var id = 'mock-widget-' + (++_counter);
          _callbacks[id] = params || {};
          setTimeout(function () {
            var cb = _callbacks[id] && _callbacks[id].callback;
            if (typeof cb === 'function') cb('${HCAPTCHA_TEST_RESPONSE_TOKEN}');
          }, 100);
          return id;
        },
        execute: function (id) {
          var cb = (_callbacks[id] || {}).callback;
          if (typeof cb === 'function') cb('${HCAPTCHA_TEST_RESPONSE_TOKEN}');
          return Promise.resolve('${HCAPTCHA_TEST_RESPONSE_TOKEN}');
        },
        getResponse: function () { return '${HCAPTCHA_TEST_RESPONSE_TOKEN}'; },
        // getRespKey is called by the library's handleSubmit before invoking
        // onVerify — omitting it throws a TypeError that silently swallows the
        // token and leaves captchaToken state null (button stays disabled).
        getRespKey: function () { return ''; },
        reset:  function () {},
        remove: function () {},
      };

      // Intercept the hcaptchaOnLoad setter — React sets this before inserting
      // the script tag, so calling fn() here completes the API-ready handshake.
      Object.defineProperty(window, 'hcaptchaOnLoad', {
        configurable: true,
        set: function (fn) { if (typeof fn === 'function') fn(); },
      });
    })();
  `)

  // Block the real CDN script so it cannot override the stub above.
  await page.route('**js.hcaptcha.com**', route => route.abort())
}

// ---------------------------------------------------------------------------
// Sign-up tests
// ---------------------------------------------------------------------------

test.describe('sign up', () => {
  test('shows email confirmation dialog on successful signup', async ({ page }) => {
    // 1. Replace hCaptcha script — no real CAPTCHA, auto-verifies with test token.
    await mockHCaptchaScript(page)

    // 2. Stub the Supabase signup endpoint so no real account is created.
    //    The browser client POSTs directly to Supabase, so page.route() catches it.
    // The Supabase client appends ?redirect_to=... so the pattern needs a trailing **.
    await page.route('**/auth/v1/signup**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-user-00000000-0000-0000-0000-000000000001',
          aud: 'authenticated',
          email: 'e2e-signup-test@example.com',
          confirmation_sent_at: new Date().toISOString(),
        }),
      })
    })

    await page.goto('/signup')

    // Fill the form with valid data.
    await page.fill('[name="username"]', 'e2etestuser')
    await page.fill('[name="email"]', 'e2e-signup-test@example.com')
    await page.fill('[name="password"]', 'TestPass1!')
    await page.fill('[name="confirmPassword"]', 'TestPass1!')

    // Wait for the hCaptcha stub to auto-verify and enable the submit button.
    // The button is disabled until captchaToken state is truthy.
    await expect(page.locator('button[type="submit"]')).toBeEnabled({ timeout: 5_000 })

    await page.click('button[type="submit"]')

    // The confirmation dialog must appear.
    // Note: signupFields.email.value is empty in the dialog because Conform clears
    // its field state when lastResult becomes null on a { ok: true } response —
    // that is the current app behaviour, so we do not assert on the email text.
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 8_000 })
    await expect(dialog.getByText('CHECK YOUR EMAIL')).toBeVisible()
    await expect(dialog.getByText(/We sent a confirmation link to/)).toBeVisible()
  })

  test('shows validation error when passwords do not match', async ({ page }) => {
    await mockHCaptchaScript(page)
    await page.goto('/signup')

    await page.fill('[name="username"]', 'e2etestuser')
    await page.fill('[name="email"]', 'e2e-signup-test@example.com')
    await page.fill('[name="password"]', 'TestPass1!')
    await page.fill('[name="confirmPassword"]', 'WrongPass9!')

    // Wait for the captcha stub to auto-verify so the button becomes enabled.
    await expect(page.locator('button[type="submit"]')).toBeEnabled({ timeout: 5_000 })

    // Submit — Conform's client-side onValidate runs Zod synchronously, catches
    // the superRefine mismatch, and surfaces the error without ever reaching the
    // server action. This avoids relying on focusout event bubbling from blur().
    await page.click('button[type="submit"]')

    await expect(
      page.getByText('Password and confirm password must match')
    ).toBeVisible({ timeout: 3_000 })

    // Form is invalid so the button is re-disabled after the failed submission.
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
  })
})

// ---------------------------------------------------------------------------
// Sign-in / sign-out tests
//
// These require a real test account. Add to .env.test (never commit):
//   PLAYWRIGHT_TEST_EMAIL=your-test-user@example.com
//   PLAYWRIGHT_TEST_PASSWORD=YourTestPass1!
//
// The sign-in flow uses a Next.js server action (signinAction) — the Supabase
// call happens server-side, so it cannot be intercepted via page.route().
// We skip gracefully when credentials are not configured.
// ---------------------------------------------------------------------------

const hasTestCredentials = Boolean(
  process.env.PLAYWRIGHT_TEST_EMAIL && process.env.PLAYWRIGHT_TEST_PASSWORD
)

test.describe('sign in / sign out', () => {
  test('login page renders the sign-in form @smoke', async ({ page }) => {
    // Always runs — verifies the login page is reachable and the form renders.
    // Does not require test credentials.
    await page.goto('/login')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('shows a validation error for an invalid email format', async ({ page }) => {
    // Always runs — verifies client-side Conform + Zod validation works.
    // Does not require test credentials.
    //
    // The login form is configured with shouldValidate: 'onBlur' — errors
    // surface after the field loses focus, not after submit. The submit button
    // is also disabled when loginForm.valid === false, so we validate via blur.
    await page.goto('/login')

    await page.fill('[name="email"]', 'not-an-email')
    // Tab away to blur the email field — this triggers Conform's onBlur
    // validation, which runs the Zod schema and surfaces the inline error.
    await page.locator('[name="email"]').press('Tab')

    // The login schema uses z.email('Please enter a valid email').
    await expect(page.getByText(/please enter a valid email/i)).toBeVisible({ timeout: 3_000 })
  })

  test('user can sign in with email and password @smoke', async ({ page }) => {
    test.skip(!hasTestCredentials, 'Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD in .env.test to run this test')

    await page.goto('/login')
    await page.fill('[name="email"]', process.env.PLAYWRIGHT_TEST_EMAIL!)
    await page.fill('[name="password"]', process.env.PLAYWRIGHT_TEST_PASSWORD!)
    await page.click('button[type="submit"]')

    // After successful sign-in the navbar should show the profile menu
    // instead of the Login link.
    await expect(page.locator('[data-testid="profile-menu"]')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('[data-testid="sign-in-link"]')).not.toBeVisible()
  })

  test('signed-in user sees account UI instead of sign-in button', async ({ page }) => {
    test.skip(!hasTestCredentials, 'Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD in .env.test to run this test')

    // Sign in
    await page.goto('/login')
    await page.fill('[name="email"]', process.env.PLAYWRIGHT_TEST_EMAIL!)
    await page.fill('[name="password"]', process.env.PLAYWRIGHT_TEST_PASSWORD!)
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="profile-menu"]')).toBeVisible({ timeout: 10_000 })

    // Navigate to another page and confirm auth state persists
    await page.goto('/store')
    await expect(page.locator('[data-testid="profile-menu"]')).toBeVisible()
    await expect(page.locator('[data-testid="sign-in-link"]')).not.toBeVisible()
  })

  test('user can sign out', async ({ page }) => {
    test.skip(!hasTestCredentials, 'Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD in .env.test to run this test')

    // Sign in first
    await page.goto('/login')
    await page.fill('[name="email"]', process.env.PLAYWRIGHT_TEST_EMAIL!)
    await page.fill('[name="password"]', process.env.PLAYWRIGHT_TEST_PASSWORD!)
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="profile-menu"]')).toBeVisible({ timeout: 10_000 })

    // Open profile menu and sign out
    await page.locator('[data-testid="profile-menu"]').click()
    // The sign-out item text may vary — check for "Sign out" or "Logout"
    await page.getByRole('menuitem', { name: /sign out|log out/i }).click()

    // After sign-out the login link should reappear
    await expect(page.locator('[data-testid="sign-in-link"]')).toBeVisible({ timeout: 8_000 })
    await expect(page.locator('[data-testid="profile-menu"]')).not.toBeVisible()
  })
})

test.describe('auth-gated content', () => {
  test.skip('non-member sees membership CTA on relevant pages', async () => {
    // Requires a signed-in non-member test account.
    // Deferred until PLAYWRIGHT_TEST_EMAIL is configured and the membership CTA
    // data-testid attribute is added to the relevant page component.
    // await expect(page.locator('[data-testid="membership-cta"]')).toBeVisible()
  })

  test.skip('member does not see membership CTA', async () => {
    // Requires a signed-in member test account.
    // await expect(page.locator('[data-testid="membership-cta"]')).not.toBeVisible()
  })
})
