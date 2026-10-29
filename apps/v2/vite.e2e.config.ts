import { mergeConfig } from 'vite'
import baseConfig from './vite.config'

// Dev server for the Playwright suite only (playwright.config.ts starts it on port 3101 with
// E2E_SANDBOX=true). Same app and plugins as vite.config.ts, but no file watching and no HMR, so an
// edit made while the suite runs can never full-reload a page in the middle of a test. Restart the
// E2E server to pick up code changes.
export default mergeConfig(baseConfig, {
  server: { port: 3101, strictPort: true, hmr: false, watch: { ignored: ['**/*'] } },
})
