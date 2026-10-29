import { readCookie, serializeCookie } from '~/server/downloads/http'
import { isBot } from '~/server/identity/bots'
import { ensureVisitor as defaultEnsureVisitor, type EnsureVisitorInput } from '~/server/identity/visitor'
import { recordEvents as defaultRecordEvents, type RecordEventsInput } from './record'
import { trackBatchSchema } from './schema'

// POST /api/track (phase 06.3), framework-free so unit tests drive it with a plain Request and fakes.
// The only public write endpoint: same-origin only, bots are answered 204 with nothing written, the
// body is the allow-listed batch schema, and the anonymous visitor is created here lazily.

const TAG = '[api/track]'
/** 20 events at the 2 KB property cap, plus JSON overhead. Larger bodies are rejected unread. */
export const MAX_BODY_BYTES = 64 * 1024

export const TRACK_HEADERS = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } as const

export type TrackDeps = {
  /** `claims.sub` from the supabaseSession request middleware, or null when signed out. */
  userId: string | null
  /** False only on http://localhost (the anon_token cookie is Secure everywhere else). */
  secureCookies?: boolean
  ensureVisitor?: (input: EnsureVisitorInput) => Promise<{ id: string } | null>
  recordEvents?: (input: RecordEventsInput) => Promise<void>
}

/**
 * Same rules as the global CSRF request middleware (src/start.ts), which already guards this POST:
 * Sec-Fetch-Site must be same-origin when the browser sends it, otherwise Origin must equal the
 * request origin. Stricter in one way: a request with neither header is rejected (the middleware
 * would fall back to Referer); sendBeacon and fetch always send at least Origin on a POST.
 */
export function isSameOriginRequest(request: Request): boolean {
  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite !== null) return fetchSite === 'same-origin'
  const origin = request.headers.get('origin')
  return origin !== null && origin === new URL(request.url).origin
}

const empty = (status: number, setCookies: string[] = []) => {
  const headers = new Headers(TRACK_HEADERS)
  for (const cookie of setCookies) headers.append('Set-Cookie', cookie)
  return new Response(null, { status, headers })
}

async function readBatch(request: Request) {
  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > MAX_BODY_BYTES) return null
  const text = await request.text()
  if (text.length > MAX_BODY_BYTES) return null
  try {
    const parsed = trackBatchSchema.safeParse(JSON.parse(text))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export async function handleTrackRequest(request: Request, deps: TrackDeps): Promise<Response> {
  if (!isSameOriginRequest(request)) return empty(403)
  if (isBot(request.headers.get('user-agent'))) return empty(204)

  const batch = await readBatch(request)
  if (!batch) return empty(400)

  const setCookies: string[] = []
  let anonymousVisitorId: string | null = null
  if (!deps.userId) {
    try {
      const cookieHeader = request.headers.get('cookie')
      const visitor = await (deps.ensureVisitor ?? defaultEnsureVisitor)({
        getCookie: (name) => readCookie(cookieHeader, name),
        setCookie: (name, value, options) => void setCookies.push(serializeCookie(name, value, options)),
        userAgent: request.headers.get('user-agent'),
        secure: deps.secureCookies ?? true,
      })
      // Null only for bots, which are already answered above; nothing to attribute the events to.
      if (!visitor) return empty(204)
      anonymousVisitorId = visitor.id
    } catch (error) {
      console.error(TAG, 'ensureVisitor failed', error instanceof Error ? error.message : error)
      return empty(500)
    }
  }

  try {
    await (deps.recordEvents ?? defaultRecordEvents)({ userId: deps.userId, anonymousVisitorId, events: batch.events })
  } catch (error) {
    console.error(TAG, 'recordEvents failed', error instanceof Error ? error.message : error)
    return empty(500, setCookies)
  }
  return empty(204, setCookies)
}
