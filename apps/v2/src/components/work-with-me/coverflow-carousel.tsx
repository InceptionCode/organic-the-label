import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { slideLabel, type CoverflowProps } from './post-slides'

// v1 coverflow-carousel.tsx ported 1:1: 3D coverflow with rAF drag physics, arrow keys, previous and
// next buttons, dots. Loaded only through LazyVisual (never under reduced motion or Save-Data, where
// the scroll-snap poster stays), so the motion here needs no reduced-motion branch of its own.

const ROTATE = 44
const DEPTH = 0.6
const PERSPECTIVE = 3
const FALLOFF = 0.56
const FADE = 0.1
const GAP = 0.06
const DRAG_THRESHOLD = 6

type Drag = { id: number; x: number; pos: number; v: number; t: number; captured: boolean }

const controlClasses =
  'absolute top-1/2 z-[200] flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[rgba(224,61,42,0.22)] bg-surface-1 text-secondary transition-colors duration-150 hover:bg-surface-2 hover:text-[color:var(--text-primary)] active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]'

export default function CoverflowCarousel({ slides, onActivate, label }: CoverflowProps) {
  const count = slides.length
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([])
  const frameRef = useRef<HTMLDivElement>(null)
  const pos = useRef(0)
  const target = useRef(0)
  const width = useRef(0)
  const raf = useRef<number | null>(null)
  const drag = useRef<Drag | null>(null)
  const [selected, setSelected] = useState(0)

  const indexAt = (p: number) => ((Math.round(p) % count) + count) % count

  function paint() {
    const w = width.current
    if (!w) return
    const pitch = w * (1 + GAP)
    cardRefs.current.forEach((card, index) => {
      if (!card) return
      let offset = (((index - pos.current) % count) + count) % count
      if (offset > count / 2) offset -= count
      const distance = Math.abs(offset)
      const ramp = Math.pow(distance, FALLOFF)
      const tilt = Math.min(ROTATE * ramp, 82) * Math.sign(offset)
      card.style.transform = `translateX(calc(-50% + ${offset * pitch}px)) translateZ(${-DEPTH * w * ramp}px) rotateY(${-tilt}deg)`
      const edge = Math.min(1, Math.max(0, count / 2 - distance))
      card.style.opacity = String(Math.max(0, 1 - FADE * distance) * edge)
      card.style.zIndex = String(100 - Math.round(distance))
    })
  }

  function settle(to: number) {
    if (raf.current !== null) cancelAnimationFrame(raf.current)
    target.current = to
    setSelected(indexAt(to))
    const step = () => {
      const remaining = to - pos.current
      if (Math.abs(remaining) < 0.0004) {
        pos.current = to
        paint()
        raf.current = null
        return
      }
      pos.current += remaining * 0.16
      paint()
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }

  const goTo = (index: number) => settle(index + Math.round((target.current - index) / count) * count)
  const nudge = (by: number) => settle(Math.round(target.current) + by)

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (raf.current !== null) {
      cancelAnimationFrame(raf.current)
      raf.current = null
    }
    target.current = pos.current
    drag.current = { id: event.pointerId, x: event.clientX, pos: pos.current, v: 0, t: event.timeStamp, captured: false }
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d || d.id !== event.pointerId) return
    if (!d.captured) {
      if (Math.abs(event.clientX - d.x) < DRAG_THRESHOLD) return // still a tap
      d.captured = true
      d.x = event.clientX
      d.pos = pos.current
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        /* capture is best effort */
      }
    }
    const pitch = width.current * (1 + GAP)
    if (!pitch) return
    const now = event.timeStamp
    const previous = pos.current
    pos.current = d.pos - (event.clientX - d.x) / pitch
    d.v = ((pos.current - previous) / Math.max(now - d.t, 1)) * 1000
    d.t = now
    const index = indexAt(pos.current)
    if (index !== selected) setSelected(index)
    paint()
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d || d.id !== event.pointerId) return
    drag.current = null
    if (!d.captured) return // a tap: the card's onClick runs
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      /* already released */
    }
    const carried = Math.max(-2, Math.min(2, d.v * 0.18))
    settle(Math.round(pos.current + carried))
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      nudge(-1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      nudge(1)
    }
  }

  const measure = useEffectEvent(() => {
    const card = cardRefs.current[0]
    if (!card) return
    width.current = card.offsetWidth
    paint()
  })

  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    measure()
    const observer = new ResizeObserver(() => measure())
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  useEffect(
    () => () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current)
    },
    [],
  )

  const active = slides[selected]

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label} className="w-full" style={{ '--cf-card': 'clamp(168px, 24vw, 300px)' } as CSSProperties}>
      <div className="relative">
        <div
          ref={frameRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
          className="cursor-grab overflow-hidden py-10 outline-none active:cursor-grabbing"
          style={{ perspective: `calc(var(--cf-card) * ${PERSPECTIVE})`, touchAction: 'pan-y' }}
        >
          <div className="relative select-none" style={{ height: 'var(--cf-card)', transformStyle: 'preserve-3d' }}>
            {slides.map((slide, index) => {
              const centre = index === selected
              return (
                <button
                  key={slide.key}
                  type="button"
                  ref={(node) => {
                    cardRefs.current[index] = node
                  }}
                  aria-roledescription="slide"
                  aria-label={slideLabel(slide, index, count)}
                  data-centered={centre ? 'true' : undefined}
                  onClick={() => (centre ? onActivate(slide) : goTo(index))}
                  className="absolute left-1/2 top-0 aspect-square cursor-pointer overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(224,61,42,0.16)] bg-surface-2 shadow-lg-premium will-change-transform outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
                  style={{ width: 'var(--cf-card)' }}
                >
                  <img
                    src={slide.src}
                    alt=""
                    width={300}
                    height={300}
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                    className="pointer-events-none absolute inset-0 size-full select-none object-cover"
                  />
                  {centre ? (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 flex items-center justify-center"
                      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent 55%)' }}
                    >
                      <span className="flex size-14 items-center justify-center rounded-full bg-[color:var(--accent-primary)] shadow-glow">
                        <Play className="ml-[3px] size-6 text-white" />
                      </span>
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>
        <button type="button" aria-label="Previous" onClick={() => nudge(-1)} className={`${controlClasses} left-2`}>
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        <button type="button" aria-label="Next" onClick={() => nudge(1)} className={`${controlClasses} right-2`}>
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>

      {active?.title ? <p className="mx-auto mt-3 line-clamp-1 max-w-md px-6 text-center text-body-s text-secondary">{active.title}</p> : null}

      <div className="mt-2 flex items-center justify-center">
        {slides.map((slide, index) => (
          <button
            key={slide.key}
            type="button"
            aria-label={`Go to ${index + 1}`}
            aria-current={index === selected}
            onClick={() => goTo(index)}
            className="group flex size-11 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
          >
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-[color:var(--accent-secondary)] transition-transform duration-150 group-hover:scale-125 group-active:scale-90"
              style={{ opacity: index === selected ? 1 : 0.3 }}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
