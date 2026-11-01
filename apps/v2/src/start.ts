import { createCsrfMiddleware, createServerOnlyFn, createStart } from '@tanstack/react-start'
import { env } from '~/server/env'
import { cacheGuard } from '~/fns/middleware/cache-guard'
import { robotsHeader } from '~/fns/middleware/robots'
import { supabaseSession } from '~/fns/middleware/session'

// Importing env validates it when the server boots. The reference sits in a server-only fn so
// the client build drops the import (a bare side-effect import would ship env.ts to the browser).
export const getServerEnv = createServerOnlyFn(() => env)

// Server-to-server POSTs that verify their own HMAC signature (server/cache/purge.ts); exact paths only.
const SIGNED_CACHE_PATHS: ReadonlySet<string> = new Set(['/api/cache/purge', '/api/cache/flush'])

const isSignedCachePurge = (handlerType: string, method: string, pathname: string) =>
  handlerType !== 'serverFn' && method === 'POST' && SIGNED_CACHE_PATHS.has(pathname)

const csrf = createCsrfMiddleware({
  filter: ({ handlerType, request, pathname }) =>
    !isSignedCachePurge(handlerType, request.method, pathname) &&
    (handlerType === 'serverFn' || !['GET', 'HEAD', 'OPTIONS'].includes(request.method)),
})

export const startInstance = createStart(() => ({
  requestMiddleware: [robotsHeader, csrf, supabaseSession, cacheGuard],
}))

declare module '@tanstack/react-start' {
  interface Register {
    config: Awaited<ReturnType<typeof startInstance.getOptions>>
  }
}
