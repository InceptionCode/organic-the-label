import { cleanupAll } from './support/admin'
import { IS_LOCAL_SANDBOX } from './support/env'

// Removes every row the suite created in the DEV project: e2e+ contacts (with tags, events and
// resource downloads), e2e+ support requests, the test user's activity rows and any seeded manual
// entitlements, and resets the test user's preferences. The test user itself is kept for next time.
export default async function globalTeardown() {
  if (!IS_LOCAL_SANDBOX) return
  await cleanupAll()
}
