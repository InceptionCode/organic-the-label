import { createFileRoute } from '@tanstack/react-router'
import { handleSandboxRequest } from '~/server/sandbox'

// GET /api/__sandbox (phase 07.4): the E2E email sandbox log. 404 unless E2E_SANDBOX=true on a
// non-production runtime (see src/server/sandbox.ts), so it is inert on every deploy.
export const Route = createFileRoute('/api/__sandbox')({
  server: {
    handlers: {
      GET: () => handleSandboxRequest(),
    },
  },
})
