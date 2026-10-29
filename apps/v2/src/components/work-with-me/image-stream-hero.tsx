import { useEffect, useRef } from 'react'

// v1 image-stream-hero.tsx: a CSS 3D corridor of cover cards. v1 generated @keyframes at runtime and
// injected a <style> tag; v2 runs the same corridor math through the Web Animations API
// (element.animate with transform keyframes), so nothing is injected. Lazy only (LazyVisual).

const PATH = {
  perspective: 30,
  cardWidth: 18,
  cardHeight: 25,
  cardRadius: 0.35,
  birthHeight: 2.6,
  exitHeight: 46,
  railBirth: -11,
  railExit: 44,
  fan: 3.3,
  turnBirth: 6,
  turnExit: 28,
  stops: 24,
} as const

/** The v1 keyframe stops for one side of the corridor (dir 1 right, -1 left). */
export function corridorKeyframes(dir: 1 | -1): Keyframe[] {
  const p = PATH
  return Array.from({ length: p.stops + 1 }, (_, s) => {
    const u = s / p.stops
    const scale = (p.birthHeight / p.cardHeight) * Math.pow(p.exitHeight / p.birthHeight, u)
    const z = p.perspective * (1 - 1 / scale)
    const rail = p.railExit - (p.railExit - p.railBirth) * Math.pow(1 - u, p.fan)
    const turn = p.turnBirth + (p.turnExit - p.turnBirth) * u
    return {
      offset: u,
      transform: `translate3d(${(dir * rail).toFixed(2)}cqw,0,${z.toFixed(2)}cqw) rotateY(${(-dir * turn).toFixed(2)}deg)`,
    }
  })
}

export type StreamImage = { src: string; alt?: string }
export type ImageStreamHeroProps = { images: StreamImage[]; cards?: number; speed?: number; axis?: number }

export default function ImageStreamHero({ images, cards = 8, speed = 26, axis = 55 }: ImageStreamHeroProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const durationMs = speed * 1000
    const animations = Array.from(root.querySelectorAll<HTMLElement>('[data-corridor]')).map((el) => {
      const dir = el.dataset.corridor === 'right' ? 1 : -1
      const i = Number(el.dataset.index ?? 0)
      return el.animate(corridorKeyframes(dir), {
        duration: durationMs,
        iterations: Infinity,
        easing: 'linear',
        delay: -((i * speed) / cards) * 1000,
      })
    })
    // Pause off screen (v1 used an IntersectionObserver with a 200px margin).
    const io = new IntersectionObserver(
      ([entry]) => animations.forEach((a) => (entry?.isIntersecting ? a.play() : a.pause())),
      { rootMargin: '200px 0px' },
    )
    io.observe(root)
    return () => {
      io.disconnect()
      animations.forEach((a) => a.cancel())
    }
  }, [cards, speed])

  return (
    <div ref={rootRef} aria-hidden="true" className="relative size-full overflow-hidden" style={{ containerType: 'inline-size' }}>
      <div className="pointer-events-none absolute inset-0" style={{ perspective: `${PATH.perspective}cqw`, perspectiveOrigin: `50% ${axis}%` }}>
        <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
          {(['right', 'left'] as const).map((side) =>
            Array.from({ length: cards }, (_, i) => {
              const img = images[i % Math.max(images.length, 1)]
              return (
                <div
                  key={`${side}-${i}`}
                  data-corridor={side}
                  data-index={i}
                  className="absolute overflow-hidden border border-[rgba(233,220,198,0.12)]"
                  style={{
                    left: '50%',
                    top: `${axis}%`,
                    width: `${PATH.cardWidth}cqw`,
                    height: `${PATH.cardHeight}cqw`,
                    marginLeft: `${-PATH.cardWidth / 2}cqw`,
                    marginTop: `${-PATH.cardHeight / 2}cqw`,
                    borderRadius: `${PATH.cardRadius}cqw`,
                    backfaceVisibility: 'hidden',
                    // First frame before the animation starts: parked at the corridor birth point.
                    transform: 'translate3d(0,0,-300cqw)',
                  }}
                >
                  {img ? <img src={img.src} alt="" loading="lazy" decoding="async" draggable={false} className="size-full object-cover" /> : null}
                </div>
              )
            }),
          )}
        </div>
      </div>
    </div>
  )
}
