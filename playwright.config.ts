import { defineConfig, devices } from '@playwright/test'
import * as dotenv from 'dotenv'

// Load .env.test so test-only credentials (PLAYWRIGHT_TEST_EMAIL, etc.) are
// available in the Playwright worker processes. The Next.js dev server handles
// its own env loading separately; this is purely for the Playwright process.
dotenv.config({ path: '.env.test' })

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  // Fail immediately if a test.only is committed to CI
  forbidOnly: !!process.env.CI,
  // Retry flaky tests on CI only
  retries: process.env.CI ? 2 : 0,
  // Limit parallelism on CI to reduce flakiness
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    // Reuse existing dev server when running locally
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
