import { createMiddleware } from '@tanstack/react-start'
import { setResponseStatus } from '@tanstack/react-start/server'
import { supabaseSession } from './session'

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized')
    this.name = 'UnauthorizedError'
  }
}

// The security boundary for private server fns. Route guards are UX only. Listing supabaseSession
// types the context; it is deduped against the global request middleware, so it runs once.
export const requireUser = createMiddleware({ type: 'function' })
  .middleware([supabaseSession])
  .server(async ({ next, context }) => {
    const claims = context.claims
    if (!claims) {
      setResponseStatus(401)
      throw new UnauthorizedError()
    }
    return next({ context: { userId: claims.sub, claims } })
  })
