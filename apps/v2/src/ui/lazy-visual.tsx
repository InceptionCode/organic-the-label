import { lazy, Suspense, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { whenLoadedAndIdle } from '~/lib/after-load'
import { cn } from './cn'

type NetworkNavigator = Navigator & { connection?: { saveData?: boolean } }

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

/**
 * True when heavy visuals must not load: reduced motion, Save-Data, or an automated browser
 * (navigator.webdriver, same rule as the splash and tracking). CI runners have no GPU, so WebGL falls
 * back to software rendering and can starve the main thread; the poster is what automation sees.
 */
export function prefersStaticVisuals() {
  if (typeof window === 'undefined') return true
  return (
    window.matchMedia(REDUCED_MOTION).matches ||
    (navigator as NetworkNavigator).connection?.saveData === true ||
    navigator.webdriver === true
  )
}

const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/i
let slowWebGL: boolean | undefined

/**
 * True when WebGL is missing or software-rendered (SwiftShader, llvmpipe): no GPU, so every shader
 * frame is rasterized on the CPU and the main thread waits on it (PageSpeed's mobile run measured ~21s
 * of blocking on /store from one header shader). Probed once, lazily, from an idle callback.
 */
export function hasSlowWebGL() {
  if (slowWebGL !== undefined) return slowWebGL
  try {
    const canvas = document.createElement('canvas')
    // failIfMajorPerformanceCaveat makes the browser refuse a software-backed context outright.
    const gl = canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true })
    if (!gl) {
      slowWebGL = true
    } else {
      const info = gl.getExtension('WEBGL_debug_renderer_info')
      const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '')
      slowWebGL = SOFTWARE_RENDERER.test(renderer)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  } catch {
    slowWebGL = true
  }
  return slowWebGL
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
  /** The visual renders with WebGL: keep the poster when WebGL is missing or software-rendered. */
  webgl?: boolean
}

/**
 * Mounts a heavy WebGL/shader visual only when all hold: the element is within 200px of the
 * viewport, the page has finished loading and the browser is idle (so the visual never competes with
 * the LCP resources), prefers-reduced-motion is not `reduce`, Save-Data is off, and (for `webgl`
 * visuals) the browser has a hardware WebGL renderer.
 * Otherwise the poster stays. The visual module is fetched only once those gates pass.
 */
export function LazyVisual<P extends object>({ load, poster, className, props, media, webgl = false }: LazyVisualProps<P>) {
  const ref = useRef<HTMLDivElement>(null)
  const [Visual] = useState(() => lazy(load))
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const motion = window.matchMedia(REDUCED_MOTION)
    const gate = media ? window.matchMedia(media) : null
    let cancelIdle = () => {}
    let observer: IntersectionObserver | undefined

    // Sets up the observer only; never sets state, so the initial run stays effect-safe.
    const arm = () => {
      observer?.disconnect()
      cancelIdle()
      if (prefersStaticVisuals() || (gate && !gate.matches)) return
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return
          observer?.disconnect()
          cancelIdle = whenLoadedAndIdle(() => {
            if (webgl && hasSlowWebGL()) return
            setActive(true)
          })
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
  }, [media, webgl])

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
