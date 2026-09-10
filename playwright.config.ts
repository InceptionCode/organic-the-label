import { defineConfig, devices } from '@playwright/test'
import * as dotenv from 'dotenv'

// Load .env.test so test-only credentials (PLAYWRIGHT_TEST_EMAIL, etc.) are
// available in the Playwright worker processes. The Next.js dev server handles
// its own env loading separately; this is purely for the Playwright process.
dotenv.config({ path: '.env.test' })

const isCI = !!process.env.CI

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  // Fail immediately if a test.only is committed to CI
  forbidOnly: isCI,
  // Retry flaky tests on CI only
  retries: isCI ? 2 : 0,
  // Cap workers to prevent server overload causing navigation timeouts.
  // CI runs sequentially (1 worker); local runs cap at 2 to keep the Next.js
  // dev server responsive under parallel load.
  workers: isCI ? 1 : 2,
  reporter: isCI ? 'github' : 'html',
  // Compile every route once before the suite runs — CI's cold `next dev` pays a
  // multi-second on-demand compile on first hit, which otherwise lands inside a
  // test and causes hydration-race flakes on the slow GitHub runner.
  globalSetup: './tests/e2e/global-setup.ts',
  // The whole suite has more headroom on a cold runner.
  timeout: isCI ? 90_000 : 30_000,
  expect: { timeout: isCI ? 12_000 : 5_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    // Slow-runner headroom for individual actions / navigations.
    actionTimeout: isCI ? 20_000 : 0,
    navigationTimeout: isCI ? 45_000 : 15_000,
    // Skip the first-visit splash (and steady other ambient animations) during e2e.
    contextOptions: { reducedMotion: 'reduce' },
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
    // Reuse an already-running local dev server; always start a fresh one in CI.
    reuseExistingServer: !isCI,
    // Cold `next dev` boot + first `/` compile needs generous headroom.
    timeout: 180_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
