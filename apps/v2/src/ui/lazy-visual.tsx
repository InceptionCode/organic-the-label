import { lazy, Suspense, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { cn } from './cn'

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
  cancelIdleCallback?: (handle: number) => void
}

type NetworkNavigator = Navigator & { connection?: { saveData?: boolean } }

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

/** True when heavy visuals must not load: reduced motion or Save-Data. */
export function prefersStaticVisuals() {
  if (typeof window === 'undefined') return true
  return window.matchMedia(REDUCED_MOTION).matches || (navigator as NetworkNavigator).connection?.saveData === true
}

type LazyVisualProps<P extends object> = {
  /** Dynamic import of the visual module. The only way a visual may be referenced. */
  load: () => Promise<{ default: ComponentType<P> }>
  /** Rendered on the server, on first client paint, while loading, and whenever a gate fails. */
  poster: ReactNode
  className?: string
  props?: P
  /** Extra media query gate, e.g. '(min-width: 768px)'. Below it the poster stays. */
  media?: string
}

/**
 * Mounts a heavy WebGL/shader visual only when all hold: the element is within 200px of the
 * viewport, the browser is idle, prefers-reduced-motion is not `reduce`, and Save-Data is off.
 * Otherwise the poster stays. The visual module is fetched only once those gates pass.
 */
export function LazyVisual<P extends object>({ load, poster, className, props, media }: LazyVisualProps<P>) {
  const ref = useRef<HTMLDivElement>(null)
  const [Visual] = useState(() => lazy(load))
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const motion = window.matchMedia(REDUCED_MOTION)
    const gate = media ? window.matchMedia(media) : null
    const w = window as IdleWindow
    let idleHandle: number | undefined
    let observer: IntersectionObserver | undefined

    const cancelIdle = () => {
      if (idleHandle === undefined) return
      if (w.cancelIdleCallback) w.cancelIdleCallback(idleHandle)
      else window.clearTimeout(idleHandle)
      idleHandle = undefined
    }

    // Sets up the observer only; never sets state, so the initial run stays effect-safe.
    const arm = () => {
      observer?.disconnect()
      cancelIdle()
      if (prefersStaticVisuals() || (gate && !gate.matches)) return
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return
          observer?.disconnect()
          const run = () => setActive(true)
          idleHandle = w.requestIdleCallback ? w.requestIdleCallback(run, { timeout: 2000 }) : window.setTimeout(run, 200)
        },
        { rootMargin: '200px' },
      )
      observer.observe(el)
    }

    const onMotionChange = () => {
      setActive(false)
      arm()
    }

    arm()
    motion.addEventListener('change', onMotionChange)
    gate?.addEventListener('change', onMotionChange)
    return () => {
      motion.removeEventListener('change', onMotionChange)
      gate?.removeEventListener('change', onMotionChange)
      observer?.disconnect()
      cancelIdle()
    }
  }, [media])

  return (
    <div ref={ref} className={cn('relative', className)} data-visual-state={active ? 'live' : 'poster'}>
      {active ? (
        <Suspense fallback={poster}>
          <Visual {...(props as P)} />
        </Suspense>
      ) : (
        poster
      )}
    </div>
  )
}
