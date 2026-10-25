import { createCsrfMiddleware, createServerOnlyFn, createStart } from '@tanstack/react-start'
import { env } from '~/server/env'
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

export const startInstance = createStart(() => ({ requestMiddleware: [csrf, supabaseSession] }))

declare module '@tanstack/react-start' {
  interface Register {
    config: Awaited<ReturnType<typeof startInstance.getOptions>>
  }
}
