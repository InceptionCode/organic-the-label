// Framework-free HTTP helpers for the download server routes (compositions, free resources). The
// routes build their own Response, so cookies are read from and written to that Response directly.

/** Headers every download response carries: never cached by a CDN, never indexed. */
export const DOWNLOAD_HEADERS = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' } as const

export function readCookie(cookieHeader: string | null | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=')
    if (eq === -1) continue
    if (part.slice(0, eq).trim() !== name) continue
    const raw = part.slice(eq + 1).trim()
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  }
  return undefined
}

export type CookieAttributes = { httpOnly: boolean; sameSite: 'lax'; secure: boolean; path: string; maxAge: number }

export function serializeCookie(name: string, value: string, o: CookieAttributes): string {
  return [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${o.path}`,
    `Max-Age=${o.maxAge}`,
    'SameSite=Lax',
    o.httpOnly ? 'HttpOnly' : null,
    o.secure ? 'Secure' : null,
  ]
    .filter(Boolean)
    .join('; ')
}

export function jsonError(status: number, error: string, extra: HeadersInit = {}): Response {
  return Response.json({ ok: false, error }, { status, headers: { ...DOWNLOAD_HEADERS, ...extra } })
}
