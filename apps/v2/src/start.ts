import { createCsrfMiddleware, createServerOnlyFn, createStart } from '@tanstack/react-start'
import { env } from '~/server/env'
import { cacheGuard } from '~/fns/middleware/cache-guard'
import { robotsHeader } from '~/fns/middleware/robots'
import { supabaseSession } from '~/fns/middleware/session'

// Importing env validates it when the server boots. The reference sits in a server-only fn so
// the client build drops the import (a bare side-effect import would ship env.ts to the browser).
export const getServerEnv = createServerOnlyFn(() => env)

// Validate server fn calls and unsafe methods only, so cross-site page navigations
// (search engines, inbound links) still render.
const csrf = createCsrfMiddleware({
  filter: ({ handlerType, request }) =>
    handlerType === 'serverFn' || !['GET', 'HEAD', 'OPTIONS'].includes(request.method),
})

// robotsHeader runs first so even a CSRF rejection carries X-Robots-Tag on non-production hosts.
// cacheGuard runs innermost (after supabaseSession), so it sees the route's final response and downgrades
// any publicly cacheable one that could carry per-visitor state (phase 07.3).
export const startInstance = createStart(() => ({
  requestMiddleware: [robotsHeader, csrf, supabaseSession, cacheGuard],
}))

declare module '@tanstack/react-start' {
  interface Register {
    config: Awaited<ReturnType<typeof startInstance.getOptions>>
  }
}
