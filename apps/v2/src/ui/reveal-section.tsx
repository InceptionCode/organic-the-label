import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { cn } from './cn'

type RevealSectionProps = {
  children: ReactNode
  /** Fade-up distance in px (v1 default 28). */
  distance?: number
  /** Fraction of the element in view before it reveals (v1 0.12; home uses 0.08). */
  threshold?: number
  className?: string
}

export function RevealSection({ children, distance = 28, threshold = 0.12, className }: RevealSectionProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      el.dataset.revealed = 'true'
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        el.dataset.revealed = 'true'
        observer.disconnect()
      },
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return (
    <div ref={ref} className={cn('os-reveal', className)} style={{ '--reveal-distance': `${distance}px` } as CSSProperties}>
      {children}
    </div>
  )
}
