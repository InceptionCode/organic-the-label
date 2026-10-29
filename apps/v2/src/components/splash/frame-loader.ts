import type { FrameSet } from './scrub-math'

export type FrameLoader = {
  images: (HTMLImageElement | undefined)[]
  /** Frame i is loaded and decoded, so drawImage paints it. */
  ready: boolean[]
  /** Stops queued requests and cancels in-flight ones. */
  stop: () => void
}

/**
 * Loads a frame set in order (frame 0 first) with at most `concurrency` requests in flight. Each frame
 * is decoded before it counts as ready: an undecoded image drawn with drawImage can paint nothing in
 * Chrome. `onReady(i, loadedCount)` fires per frame; failed frames are skipped (the scrub falls back to
 * the nearest earlier frame).
 */
export function loadFrames(set: FrameSet, onReady: (index: number, loaded: number) => void, concurrency = 6): FrameLoader {
  const images: (HTMLImageElement | undefined)[] = []
  const ready: boolean[] = []
  const inFlight = new Set<HTMLImageElement>()
  let next = 0
  let loaded = 0
  let stopped = false

  const pump = () => {
    while (!stopped && inFlight.size < concurrency && next < set.count) start(next++)
  }

  function start(i: number) {
    const img = new Image()
    img.decoding = 'async'
    inFlight.add(img)
    const settle = (ok: boolean) => {
      inFlight.delete(img)
      if (stopped) return
      if (ok) {
        ready[i] = true
        loaded += 1
        onReady(i, loaded)
      } else {
        images[i] = undefined
      }
      pump()
    }
    img.onload = () => {
      if (stopped) return
      img.decode().then(
        () => settle(true),
        () => settle(true),
      )
    }
    img.onerror = () => settle(false)
    img.src = set.path(i)
    images[i] = img
  }

  pump()

  return {
    images,
    ready,
    stop: () => {
      stopped = true
      for (const img of inFlight) {
        img.onload = null
        img.onerror = null
        // Clearing src cancels the pending request.
        img.removeAttribute('src')
      }
      inFlight.clear()
      images.length = 0
      ready.length = 0
    },
  }
}
