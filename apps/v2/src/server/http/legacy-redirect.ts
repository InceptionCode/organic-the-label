// Phase 08.1: permanent redirects for v1 URLs that live in already-sent emails and links
// (/api/auth/confirm, /api/resources/download/:id, /api/composition/download/:slug). Implemented as
// server routes rather than vercel.json so they run locally and in E2E. Framework-free so unit tests
// drive it with plain strings.
//
// The Location is always a same-origin relative path: a fixed prefix, at most one encoded path
// segment, then the original query string untouched (token_hash, type and next must survive).

export const LEGACY_REDIRECT_HEADERS = { 'Cache-Control': 'no-store' } as const

/** Path segments that would let a browser resolve the Location somewhere other than prefix + param. */
const DOT_SEGMENT = /^(\.|%2e){1,2}$/i

/**
 * The redirect target for a legacy URL: `target` (a fixed path starting with a single `/`), plus
 * `param` encoded as one path segment when given, plus the request's query string. Returns null for
 * an empty or dot-only param so the route can answer 404 instead of redirecting up a level.
 */
export function legacyLocation(target: string, requestUrl: string, param?: string): string | null {
  if (!target.startsWith('/') || target.startsWith('//') || target.includes('\\')) {
    throw new Error(`legacyLocation: target must be a same-origin path, got ${target}`)
  }
  let path = target
  if (param !== undefined) {
    if (param === '' || DOT_SEGMENT.test(param)) return null
    path = `${target}/${encodeURIComponent(param)}`
  }
  return `${path}${new URL(requestUrl).search}`
}

/** 308 to legacyLocation(...), or a plain no-store 404 when the param cannot be redirected safely. */
export function legacyRedirect(target: string, request: Request, param?: string): Response {
  const location = legacyLocation(target, request.url, param)
  if (location === null) return new Response('Not found', { status: 404, headers: LEGACY_REDIRECT_HEADERS })
  return new Response(null, { status: 308, headers: { ...LEGACY_REDIRECT_HEADERS, Location: location } })
}
