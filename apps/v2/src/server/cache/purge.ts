import { createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { PRODUCT_HANDLE_TAG } from '~/server/http/cache-headers'

// POST /api/cache/purge (phase 07.8). apps/api calls this after each Redis bust so the CDN copies of
// the pages tagged with that family (server/http/cache-headers.ts) are invalidated too. Framework-free
// so unit tests drive it with a plain Request and a fake invalidate.
//
// Auth: X-Purge-Signature is the hex HMAC-SHA256 of `${timestamp}.${rawBody}` with CACHE_PURGE_SECRET,
// and X-Purge-Timestamp (unix seconds) must be within 5 minutes, so a captured request cannot be
// replayed later or re-signed with a fresh timestamp. This is why src/start.ts exempts this one path
// from the same-origin CSRF check: the caller is a server with no Origin header.

const TAG = '[api/cache/purge]'

export const CACHE_PURGE_PATH = '/api/cache/purge'
export const PURGE_SIGNATURE_HEADER = 'x-purge-signature'
export const PURGE_TIMESTAMP_HEADER = 'x-purge-timestamp'
export const MAX_CLOCK_SKEW_SECONDS = 5 * 60
/** 64 tags of at most `product:` + 200 chars, plus JSON overhead. Larger bodies are rejected unread. */
export const MAX_BODY_BYTES = 16 * 1024

export const PURGE_HEADERS = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } as const

const PRODUCT_TAG_PREFIX = 'product:'

/** The exact tag shapes v2 sets on cached responses; anything else is a 400. */
export function isAllowedTag(tag: string): boolean {
  if (tag === 'products' || tag === 'compositions' || tag === 'free-resources') return true
  return tag.startsWith(PRODUCT_TAG_PREFIX) && PRODUCT_HANDLE_TAG.test(tag.slice(PRODUCT_TAG_PREFIX.length))
}

export const purgeBodySchema = z.object({
  tags: z.array(z.string().refine(isAllowedTag, 'unknown cache tag')).min(1).max(64),
})

export function signPurge(secret: string, timestamp: string, rawBody: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')
}

export type SignatureCheck = 'ok' | 'missing' | 'stale' | 'invalid'

export function verifyPurgeSignature(input: {
  secret: string
  rawBody: string
  signature: string | null
  timestamp: string | null
  nowSeconds: number
}): SignatureCheck {
  const { secret, rawBody, signature, timestamp, nowSeconds } = input
  if (!signature || !timestamp) return 'missing'
  if (!/^\d{1,12}$/.test(timestamp)) return 'invalid'
  if (Math.abs(nowSeconds - Number(timestamp)) > MAX_CLOCK_SKEW_SECONDS) return 'stale'
  if (!/^[0-9a-f]{64}$/i.test(signature)) return 'invalid'
  const expected = Buffer.from(signPurge(secret, timestamp, rawBody), 'hex')
  const given = Buffer.from(signature, 'hex')
  return expected.length === given.length && timingSafeEqual(expected, given) ? 'ok' : 'invalid'
}

/** Unique tags in request order. */
export const tagsToInvalidate = (tags: readonly string[]): string[] => [...new Set(tags)]

export type PurgeDeps = {
  /** CACHE_PURGE_SECRET; undefined disables the endpoint (503). */
  secret: string | undefined
  /** False when not running inside a Vercel Function (local dev): invalidateByTag would be a silent no-op. */
  available: () => boolean
  invalidate: (tags: string[]) => Promise<void>
  /** Unix seconds; injectable for tests. */
  now?: () => number
}

const json = (status: number, body: Record<string, unknown>) => Response.json(body, { status, headers: PURGE_HEADERS })

export async function handlePurgeRequest(request: Request, deps: PurgeDeps): Promise<Response> {
  if (!deps.secret) return json(503, { ok: false, error: 'Purge is not configured.' })

  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > MAX_BODY_BYTES) return json(413, { ok: false, error: 'Body too large.' })
  const rawBody = await request.text()
  if (rawBody.length > MAX_BODY_BYTES) return json(413, { ok: false, error: 'Body too large.' })

  const check = verifyPurgeSignature({
    secret: deps.secret,
    rawBody,
    signature: request.headers.get(PURGE_SIGNATURE_HEADER),
    timestamp: request.headers.get(PURGE_TIMESTAMP_HEADER),
    nowSeconds: (deps.now ?? (() => Math.floor(Date.now() / 1000)))(),
  })
  if (check !== 'ok') {
    console.warn(TAG, 'rejected', check)
    return json(401, { ok: false, error: 'Unauthorized' })
  }

  let tags: string[]
  try {
    const parsed = purgeBodySchema.safeParse(JSON.parse(rawBody))
    if (!parsed.success) return json(400, { ok: false, error: 'Invalid tags.' })
    tags = tagsToInvalidate(parsed.data.tags)
  } catch {
    return json(400, { ok: false, error: 'Invalid JSON.' })
  }

  if (!deps.available()) {
    console.warn(TAG, 'CDN purge API unavailable outside a Vercel Function', { tags })
    return json(503, { ok: false, error: 'CDN purge is unavailable on this runtime.', tags })
  }

  try {
    await deps.invalidate(tags)
  } catch (error) {
    console.error(TAG, 'invalidateByTag failed', error instanceof Error ? error.message : error)
    return json(502, { ok: false, error: 'Invalidation failed.' })
  }
  console.info(TAG, 'invalidated', { tags })
  return json(200, { ok: true, invalidated: tags })
}
