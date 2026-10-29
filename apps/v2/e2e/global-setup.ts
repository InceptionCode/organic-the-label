import { chromium, request, type FullConfig } from '@playwright/test'
import { cleanupAll, ensureTestUser } from './support/admin'
import { BASE_URL, IS_LOCAL_SANDBOX } from './support/env'

// Runs once before the suite. Against the local sandboxed server it makes sure the server really is
// sandboxed (a reused, non-sandboxed server on the port would send real email), creates the
// dedicated test user if missing (no email is sent), and clears anything a crashed run left behind.
export default async function globalSetup(_config: FullConfig) {
  if (!IS_LOCAL_SANDBOX) return

  const ctx = await request.newContext({ baseURL: BASE_URL })
  const res = await ctx.get('/api/__sandbox')
  await ctx.dispose()
  if (res.status() !== 200) {
    throw new Error(`${BASE_URL} is not running with E2E_SANDBOX=true (GET /api/__sandbox answered ${res.status()}). Stop it and rerun.`)
  }

  await warmUp()

  const user = await ensureTestUser()
  process.env.E2E_USER_ID = user.id
  await cleanupAll()
}

// The dev server optimizes dependencies the first time a browser loads each page graph and then
// forces a full reload, which would abort whichever test happens to run first. Load the main pages
// once, until they settle, before any test starts.
const WARM_PATHS = ['/', '/store', '/store/wave-pack', '/compositions', '/free', '/free/starter-kit', '/contact', '/newsletter', '/search?q=wave', '/login', '/signup', '/explore', '/work-with-me']

async function warmUp() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  try {
    for (const path of WARM_PATHS) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle', timeout: 60_000 })
          // Lazy chunks (the free resource captcha, below-the-fold visuals) mount on scroll; load them
          // too so their dependency optimization happens here, not mid-test.
          await page.mouse.wheel(0, 20_000)
          await page.waitForLoadState('networkidle', { timeout: 30_000 })
          await page.waitForTimeout(500)
          await page.waitForLoadState('networkidle', { timeout: 30_000 })
          break
        } catch {
          // A dependency-optimization reload interrupted the load; try again.
        }
      }
    }
  } finally {
    await browser.close()
  }
}
