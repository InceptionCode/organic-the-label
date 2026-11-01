import { defineConfig, devices } from '@playwright/test'

// Phase 07.4 E2E suite. See apps/v2/docs/internal-docs/testing.md.
//
// Without E2E_BASE_URL, Playwright starts its OWN dev server on port 3101 with E2E_SANDBOX=true
// (emails and MailerLite calls are recorded, never sent; see src/server/sandbox.ts), so the normal
// dev server on 3001 is never touched. With E2E_BASE_URL (a preview deploy, say) no server is
// started and the sandbox and dev-database specs skip themselves. The E2E server uses
// vite.e2e.config.ts (no file watching, no HMR), so restart it after changing app code.

export const E2E_PORT = 3101
const baseURL = process.env.E2E_BASE_URL || `http://localhost:${E2E_PORT}`

export default defineConfig({
  testDir: './e2e',
  // Specs share one dedicated test user and its rows, so they run one at a time.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // The first hit on each route compiles it in the dev server.
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? 'github' : [['list']],
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    // Same-origin server fn calls need no special headers; keep the viewport desktop by default.
    ...devices['Desktop Chrome'],
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `bunx vite dev --config vite.e2e.config.ts --port ${E2E_PORT} --strictPort`,
        url: `${baseURL}/api/__sandbox`,
        env: { E2E_SANDBOX: 'true' },
        // Reusing is safe: global-setup refuses a server on this port that is not sandboxed.
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: 'ignore',
        stderr: 'pipe',
      },
})
