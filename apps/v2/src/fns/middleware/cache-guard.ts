import { createMiddleware } from '@tanstack/react-start'
import { cookieNames, guardCacheControl } from '~/server/http/cache-headers'

// Phase 07.3. Runs after the route (and every inner middleware) has produced its response, and turns a
// publicly cacheable response into `private, no-store` whenever it could carry per-visitor state. The
// rules live in server/http/cache-headers.ts (guardCacheControl), which is unit tested.
export const cacheGuard = createMiddleware().server(async ({ next, request, pathname }) => {
  const result = await next()
  const { response } = result
  const forced = guardCacheControl({
    method: request.method,
    pathname,
    status: response.status,
    requestCookies: cookieNames(request.headers.get('cookie')),
    setsCookie: response.headers.has('set-cookie'),
    cacheControl: response.headers.get('cache-control'),
  })
  if (!forced) return result
  try {
    response.headers.set('Cache-Control', forced)
    return result
  } catch {
    // Immutable headers (a proxied fetch response): rebuild the response with the forced header.
    const headers = new Headers(response.headers)
    headers.set('Cache-Control', forced)
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
  }
})
