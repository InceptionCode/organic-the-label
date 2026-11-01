/**
 * Phase 08.0 post-deploy cache flush. `bun run flush:caches` (or the post-deploy-flush workflow).
 *
 * Signs `{"scope":"all"}` with CACHE_PURGE_SECRET (same HMAC format as /api/cache/purge) and POSTs it to
 * `${FLUSH_TARGET_URL}/api/cache/flush`, which deletes every v2 Redis namespace and invalidates every CDN
 * tag family. VERCEL_AUTOMATION_BYPASS_SECRET, when set, is sent as `x-vercel-protection-bypass` so the
 * request reaches a protected Preview deployment (dev.organicsonics.com). Exits non-zero on any failure.
 * Secrets are never printed. See docs/internal-docs/ci-cd.md.
 */
import { PURGE_SIGNATURE_HEADER, PURGE_TIMESTAMP_HEADER, signPurge } from '../src/server/cache/purge'

export const FLUSH_PATH = '/api/cache/flush'
export const BYPASS_HEADER = 'x-vercel-protection-bypass'
const TIMEOUT_MS = 60_000

export type FlushConfig = {
  targetUrl: string | undefined
  secret: string | undefined
  bypassSecret?: string | undefined
}

/** The flush endpoint URL for a site origin. Only https origins (or http on localhost) are accepted. */
export function flushUrl(targetUrl: string | undefined): string {
  if (!targetUrl) throw new Error('FLUSH_TARGET_URL is not set.')
  let url: URL
  try {
    url = new URL(targetUrl)
  } catch {
    throw new Error('FLUSH_TARGET_URL is not a valid URL.')
  }
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) {
    throw new Error('FLUSH_TARGET_URL must be an https origin.')
  }
  return `${url.origin}${FLUSH_PATH}`
}

/** Builds the signed POST. `nowSeconds` is injectable for tests. */
export function buildFlushRequest(config: FlushConfig, nowSeconds = Math.floor(Date.now() / 1000)): Request {
  if (!config.secret) throw new Error('CACHE_PURGE_SECRET is not set.')
  const body = JSON.stringify({ scope: 'all' })
  const timestamp = String(nowSeconds)
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    [PURGE_TIMESTAMP_HEADER]: timestamp,
    [PURGE_SIGNATURE_HEADER]: signPurge(config.secret, timestamp, body),
  }
  if (config.bypassSecret) headers[BYPASS_HEADER] = config.bypassSecret
  return new Request(flushUrl(config.targetUrl), { method: 'POST', headers, body, redirect: 'manual' })
}

/** Sends the flush and returns the parsed JSON summary; throws on a non-2xx answer. */
export async function runFlush(config: FlushConfig, fetchImpl: typeof fetch = fetch): Promise<unknown> {
  const request = buildFlushRequest(config)
  const res = await fetchImpl(request, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  const text = await res.text()
  let summary: unknown = text.slice(0, 500)
  try {
    summary = JSON.parse(text)
  } catch {
    // Not JSON (a protection page or a proxy error): keep the truncated text.
  }
  if (!res.ok) {
    throw new Error(`Flush failed: HTTP ${res.status} from ${new URL(request.url).origin}: ${JSON.stringify(summary)}`)
  }
  return summary
}

if (import.meta.main) {
  try {
    const summary = await runFlush({
      targetUrl: process.env.FLUSH_TARGET_URL,
      secret: process.env.CACHE_PURGE_SECRET,
      bypassSecret: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
    })
    console.log('[flush-caches] ok', JSON.stringify(summary))
  } catch (error) {
    console.error('[flush-caches]', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
