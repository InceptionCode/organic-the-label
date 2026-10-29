import type { ActivityEventType } from '~/server/activity/schema'

// Client activity queue (phase 06.4). Events wait in memory and leave in one beacon when the queue
// reaches 20, 10 seconds after the first queued event, or when the page is hidden or unloaded, so
// navigation never waits on tracking. No-op during SSR and for automated browsers. Keep this module
// tiny: it ships in the entry chunk (the cart provider calls it).

export type TrackProperties = Record<string, unknown>
type QueuedEvent = { eventType: ActivityEventType; eventProperties: TrackProperties }

export const TRACK_ENDPOINT = '/api/track'
export const FLUSH_AT = 20
export const FLUSH_AFTER_MS = 10_000
// Mirrors MAX_PROPERTIES_BYTES on the server: one oversized bag would fail the whole batch with a 400.
const MAX_PROPERTIES_BYTES = 2048
// React strict mode runs mount effects twice; the same *_viewed event for the same path is one view.
const VIEW_DEDUPE_MS = 1000

export type TrackerEnv = {
  navigator: Pick<Navigator, 'sendBeacon' | 'webdriver'>
  document: Pick<Document, 'visibilityState' | 'addEventListener'>
  window: Pick<Window, 'addEventListener'>
  location: Pick<Location, 'pathname'>
  fetch: typeof fetch
  now: () => number
}

export function createTracker(env: TrackerEnv) {
  let queue: QueuedEvent[] = []
  let timer: ReturnType<typeof setTimeout> | null = null
  let listening = false
  const lastView = new Map<string, number>()

  const send = (events: QueuedEvent[]) => {
    const body = JSON.stringify({ events })
    try {
      if (env.navigator.sendBeacon?.(TRACK_ENDPOINT, new Blob([body], { type: 'application/json' }))) return
    } catch {
      // Fall through to fetch.
    }
    void env
      .fetch(TRACK_ENDPOINT, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        keepalive: true,
      })
      .catch(() => {})
  }

  const flush = () => {
    if (timer) clearTimeout(timer)
    timer = null
    while (queue.length) send(queue.splice(0, FLUSH_AT))
  }

  const listen = () => {
    if (listening) return
    listening = true
    env.document.addEventListener('visibilitychange', () => {
      if (env.document.visibilityState === 'hidden') flush()
    })
    env.window.addEventListener('pagehide', flush)
  }

  const track = (eventType: ActivityEventType, eventProperties: TrackProperties = {}) => {
    if (env.navigator.webdriver) return
    if (new TextEncoder().encode(JSON.stringify(eventProperties)).length > MAX_PROPERTIES_BYTES) return
    if (eventType.endsWith('_viewed')) {
      const key = `${eventType} ${env.location.pathname}`
      const now = env.now()
      const last = lastView.get(key)
      lastView.set(key, now)
      if (last !== undefined && now - last < VIEW_DEDUPE_MS) return
    }
    queue.push({ eventType, eventProperties })
    listen()
    if (queue.length >= FLUSH_AT) flush()
    else timer ??= setTimeout(flush, FLUSH_AFTER_MS)
  }

  return { track, flush }
}

let tracker: ReturnType<typeof createTracker> | null = null

/** Queues one event. Safe to call anywhere: it does nothing on the server. */
export function track(eventType: ActivityEventType, eventProperties?: TrackProperties) {
  if (typeof window === 'undefined') return
  tracker ??= createTracker({
    navigator,
    document,
    window,
    location,
    fetch: (...args) => fetch(...args),
    now: () => Date.now(),
  })
  tracker.track(eventType, eventProperties)
}
