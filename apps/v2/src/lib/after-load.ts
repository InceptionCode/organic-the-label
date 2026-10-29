// Runs non-critical client work (heavy visuals, the Supabase browser client) once the page has finished
// loading and the main thread is idle, so it never competes with the LCP resources (phase 07.2).

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
  cancelIdleCallback?: (handle: number) => void
}

/** Calls `run` after the window `load` event and the next idle period (or `timeout` ms). Returns a cancel function. */
export function whenLoadedAndIdle(run: () => void, timeout = 2000): () => void {
  const w = window as IdleWindow
  let idleHandle: number | undefined
  let cancelled = false

  const schedule = () => {
    if (cancelled) return
    idleHandle = w.requestIdleCallback ? w.requestIdleCallback(run, { timeout }) : window.setTimeout(run, 200)
  }

  if (document.readyState === 'complete') schedule()
  else window.addEventListener('load', schedule, { once: true })

  return () => {
    cancelled = true
    window.removeEventListener('load', schedule)
    if (idleHandle === undefined) return
    if (w.cancelIdleCallback) w.cancelIdleCallback(idleHandle)
    else window.clearTimeout(idleHandle)
  }
}
