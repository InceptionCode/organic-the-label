import { invalidateByTag } from '@vercel/functions'

// The only module that touches @vercel/functions (phase 07.8, 00-architecture section 10). Server only:
// imported by the /api/cache/purge handler, never by route components.
//
// invalidateByTag reads the purge API from the Vercel request context and silently resolves when there
// is none (local dev, vite preview). purgeAvailable checks the same context so the endpoint can answer
// 503 instead of reporting a purge that never happened.

const REQUEST_CONTEXT = Symbol.for('@vercel/request-context')

type RequestContextStore = { get?: () => { purge?: { invalidateByTag?: unknown } } | undefined }

export function purgeAvailable(): boolean {
  const store = (globalThis as Record<symbol, RequestContextStore | undefined>)[REQUEST_CONTEXT]
  return typeof store?.get?.()?.purge?.invalidateByTag === 'function'
}

/** Marks every response carrying one of these tags stale; the next request revalidates in the background. */
export const invalidateTags = (tags: string[]): Promise<void> => invalidateByTag(tags)
