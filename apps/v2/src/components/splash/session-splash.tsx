import { useEffect, useEffectEvent, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '~/ui/cn'
import { loadFrames } from './frame-loader'
import {
  BEATS,
  beatOpacity,
  clampTarget,
  frameIndex,
  frameSetFor,
  isCommitted,
  KEY_STEP,
  MOBILE_FRAMES_QUERY,
  stepProgress,
  TOUCH_SENS,
  wheelDelta,
} from './scrub-math'

/**
 * Phase 07.7 session splash, ported from v1 (`app/components/session-splash.tsx` +
 * `ui-components/scroll-scrub-hero.tsx`). Only ever loaded by `SplashGate` after `load`, on the client.
 *
 * A native modal <dialog> (top layer: the page underneath stays in the DOM and becomes inert while it is
 * open, and focus returns on close). Wheel, trackpad, touch and arrow keys scrub a WebP frame sequence
 * on a canvas; one deliberate scroll past the end enters the site. The brand treatment (red tint, glow,
 * vignette, grain) is DOM layers over the canvas, not baked into the footage.
 */

const CANVAS = '#070707'
const EASE_SPRING = 'cubic-bezier(0.16, 1, 0.3, 1)'
const FADE_IN_MS = 400
const FADE_OUT_MS = 280
const DPR_CAP = 2

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

/** Non-production hook so tests can drive progress without input events. */
type ScrubEl = HTMLDivElement & { __scrub?: (progress: number) => void }

const controlFocus =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:#E5534B] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:#070707]'

export function SessionSplash({ onClosed }: { onClosed: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const skipRef = useRef<HTMLButtonElement>(null)
  const closingRef = useRef(false)
  const stopLoadingRef = useRef<(() => void) | null>(null)

  function finish() {
    const dialog = dialogRef.current
    if (dialog?.open) dialog.close()
    onClosed()
  }

  function dismiss() {
    if (closingRef.current) return
    closingRef.current = true
    stopLoadingRef.current?.()
    const dialog = dialogRef.current
    if (!dialog) return finish()
    dialog.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_OUT_MS, easing: 'ease-in', fill: 'forwards' }).finished.then(
      finish,
      finish,
    )
  }

  const onCommit = useEffectEvent(dismiss)
  const onNativeClose = useEffectEvent(() => {
    // Chrome may close a modal on a repeated Escape without a cancelable event; still tear down.
    if (!closingRef.current) {
      closingRef.current = true
      onClosed()
    }
  })

  // Open: top layer, fade in, focus Skip, lock page scroll.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const html = document.documentElement
    const prevOverflow = html.style.overflow
    html.style.overflow = 'hidden'
    if (!dialog.open) dialog.showModal()
    dialog.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_IN_MS, easing: EASE_SPRING })
    skipRef.current?.focus({ preventScroll: true })

    const onCancel = (e: Event) => {
      e.preventDefault()
      onCommit()
    }
    // `close` is dispatched asynchronously, so a close from an earlier effect run (StrictMode re-runs
    // effects in dev) can arrive after the dialog was reopened: only a dialog that is still closed counts.
    const onClose = () => {
      if (!dialog.open) onNativeClose()
    }
    dialog.addEventListener('cancel', onCancel)
    dialog.addEventListener('close', onClose)
    return () => {
      dialog.removeEventListener('cancel', onCancel)
      dialog.removeEventListener('close', onClose)
      if (dialog.open) dialog.close()
      html.style.overflow = prevOverflow
    }
  }, [])

  // Scrub: frames, canvas, input, rAF. Everything is torn down on unmount.
  useEffect(() => {
    const wrap = wrapRef.current as ScrubEl | null
    const canvas = canvasRef.current
    const bar = barRef.current
    const ctx = canvas?.getContext('2d')
    if (!wrap || !canvas || !ctx) return

    const set = frameSetFor(window.matchMedia(MOBILE_FRAMES_QUERY).matches)
    wrap.dataset.frameSet = set.name
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP)
    let W = 0
    let H = 0
    let raf = 0
    let lastIdx = -1 // frame index on the canvas, or -1 if nothing is drawn yet
    let entered = false
    let killed = false
    let target = 0
    let progress = 0

    const beatEls = Array.from(wrap.querySelectorAll<HTMLElement>('[data-beat]'))
    const scrollHint = wrap.querySelector<HTMLElement>('[data-hint="scroll"]')
    const enterHint = wrap.querySelector<HTMLElement>('[data-hint="enter"]')

    const loader = loadFrames(set, (i, loaded) => {
      if (killed) return
      if (bar) {
        bar.style.transform = `scaleX(${loaded / set.count})`
        if (loaded === set.count) bar.style.opacity = '0'
      }
      wrap.dataset.framesReady = String(loaded)
      // Repaint when nothing is drawn yet, or when a frame at or before the shown one arrives.
      if (lastIdx < 0 || i <= lastIdx) {
        lastIdx = -1
        paint(progress)
      }
    })
    stopLoadingRef.current = loader.stop

    function readyAtOrBelow(idx: number) {
      for (let i = idx; i >= 0; i--) if (loader.ready[i]) return i
      return -1
    }

    function drawCover(img: HTMLImageElement) {
      const ir = img.naturalWidth / img.naturalHeight
      const cr = W / H
      const dw = ir > cr ? H * ir : W
      const dh = ir > cr ? H : W / ir
      ctx!.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh)
    }

    function paint(p: number) {
      const idx = frameIndex(p, set.count)
      if ((idx !== lastIdx || lastIdx < 0) && W > 0 && H > 0) {
        const li = readyAtOrBelow(idx)
        const img = li >= 0 ? loader.images[li] : undefined
        ctx!.fillStyle = CANVAS
        ctx!.fillRect(0, 0, W, H)
        if (img) {
          drawCover(img)
          lastIdx = idx
          wrap!.dataset.frame = String(li)
        }
      }
      for (let b = 0; b < beatEls.length; b++) beatEls[b].style.opacity = String(beatOpacity(BEATS[b], p))
      if (scrollHint) scrollHint.style.opacity = String(Math.max(0, Math.min(1, 1 - p / 0.14)))
      if (enterHint) enterHint.style.opacity = String(Math.max(0, Math.min(1, (p - 0.86) / 0.1)))
      wrap!.dataset.progress = p.toFixed(3)
    }

    function resize() {
      W = wrap!.clientWidth
      H = wrap!.clientHeight
      canvas!.width = Math.round(W * dpr)
      canvas!.height = Math.round(H * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      lastIdx = -1
      paint(progress)
    }

    const commit = () => {
      if (entered) return
      entered = true
      onCommit()
    }

    function tick() {
      if (killed) return
      if (isCommitted(target)) {
        raf = 0
        commit()
        return
      }
      const nextProgress = stepProgress(progress, target)
      if (nextProgress !== progress || lastIdx < 0) {
        progress = nextProgress
        paint(progress)
      }
      raf = requestAnimationFrame(tick)
    }

    const bump = (d: number) => {
      target = clampTarget(target + d)
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      bump(wheelDelta(e.deltaY))
    }
    let touchY = 0
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? 0
    }
    const onTouchMove = (e: TouchEvent) => {
      // Let taps and drags on the controls behave normally.
      if ((e.target as Element | null)?.closest?.('button')) return
      e.preventDefault()
      const y = e.touches[0]?.clientY ?? touchY
      bump((touchY - y) * TOUCH_SENS)
      touchY = y
    }
    const onKey = (e: KeyboardEvent) => {
      const onButton = (e.target as Element | null)?.closest?.('button') != null
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !onButton)) {
        e.preventDefault()
        bump(KEY_STEP)
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        bump(-KEY_STEP)
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('keydown', onKey)
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    resize()
    raf = requestAnimationFrame(tick)

    if (import.meta.env.DEV) {
      wrap.__scrub = (v: number) => {
        target = clampTarget(v)
        progress = Math.max(0, Math.min(1, v))
        lastIdx = -1
        paint(progress)
        if (isCommitted(target)) commit()
      }
    }

    return () => {
      killed = true
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKey)
      loader.stop()
      stopLoadingRef.current = null
      if (import.meta.env.DEV) delete wrap.__scrub
      canvas.width = 0
      canvas.height = 0
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Organic Sonics"
      data-testid="session-splash"
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 bg-[#070707] p-0 text-[#F7F3EB] backdrop:bg-[#070707]"
    >
      <div
        ref={wrapRef}
        data-scrub-hero=""
        className="absolute inset-0 select-none overflow-hidden"
        style={{ background: CANVAS, touchAction: 'none', cursor: 'ns-resize' }}
      >
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />

        {/* Brand treatment: warm-dark multiply and a red re-tint pull the purple footage onto the palette;
            one red glow, a faint sand counter-light, a vignette to the canvas, and grain. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: '#2A0F09', mixBlendMode: 'multiply', opacity: 0.5 }} />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: '#B31919', mixBlendMode: 'color', opacity: 0.24 }} />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(120% 95% at 15% 4%, #B31919, transparent 52%)', mixBlendMode: 'overlay', opacity: 0.45 }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(95% 85% at 90% 98%, #D9C7A7, transparent 58%)', mixBlendMode: 'soft-light', opacity: 0.16 }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 74% 74% at 50% 47%, transparent 34%, rgba(7,7,7,0.78) 100%)' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: GRAIN, backgroundSize: '160px', opacity: 0.08, mixBlendMode: 'overlay' }}
        />

        {BEATS.map((beat, i) => (
          <div
            key={i}
            data-beat=""
            className="pointer-events-none absolute left-1/2 top-1/2 w-[min(90vw,48rem)] -translate-x-1/2 -translate-y-1/2 text-center"
            style={{ opacity: i === 0 ? 1 : 0 }}
          >
            {beat.heading && (
              <h2
                className={cn(
                  'm-0 uppercase text-[#F7F3EB] [text-shadow:0_6px_34px_rgba(7,7,7,0.55)]',
                  beat.mark ? 'text-display-l' : 'text-display-m',
                )}
              >
                {beat.heading}
              </h2>
            )}
            {beat.line && (
              <p className="m-0 mt-4 text-body-l text-[#D9C7A7] [text-shadow:0_2px_18px_rgba(7,7,7,0.65)]">{beat.line}</p>
            )}
          </div>
        ))}

        {/* Frame loading: a 2px red line along the bottom edge, scaled, gone once every frame is in. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-[rgba(247,243,235,0.08)]">
          <div
            ref={barRef}
            className="h-full origin-left bg-[#B31919] transition-[transform,opacity] duration-200 ease-out"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-[max(2.25rem,env(safe-area-inset-bottom))] flex flex-col items-center text-sm font-medium text-[#D9C7A7]"
        >
          <span className="grid">
            <span data-hint="scroll" className="[grid-area:1/1] text-center">
              Scroll
            </span>
            <span data-hint="enter" className="[grid-area:1/1] text-center" style={{ opacity: 0 }}>
              Enter
            </span>
          </span>
          <ChevronDown className="os-chevron mt-1 size-4" strokeWidth={1.5} />
        </div>
      </div>

      <div className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 flex flex-col items-end gap-1 sm:right-6 sm:top-6">
        <button
          ref={skipRef}
          type="button"
          onClick={dismiss}
          data-testid="splash-skip"
          className={cn(
            'inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-sm border border-[rgba(217,199,167,0.32)] bg-[rgba(7,7,7,0.4)] px-4 text-sm font-medium text-[#F7F3EB] touch-manipulation',
            'transition-transform duration-200 hover:border-[rgba(247,243,235,0.6)] hover:bg-[rgba(7,7,7,0.6)] active:scale-[0.97]',
            controlFocus,
          )}
        >
          Skip
        </button>
        <button
          type="button"
          onClick={dismiss}
          data-testid="splash-enter"
          className={cn(
            'link-underline inline-flex min-h-11 cursor-pointer items-center px-1 text-sm font-medium text-[#D9C7A7] touch-manipulation hover:text-[#F7F3EB] active:opacity-70',
            controlFocus,
          )}
        >
          Enter site
        </button>
      </div>
    </dialog>
  )
}
