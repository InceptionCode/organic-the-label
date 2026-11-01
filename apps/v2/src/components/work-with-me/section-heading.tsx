import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '~/ui/cn'

type SectionHeadingProps = {
  eyebrow: string
  title: string
  description?: ReactNode
  id?: string
  align?: 'left' | 'center'
  /** Eyebrow and title colors for the deep red Featured releases section. */
  tone?: 'default' | 'onRed'
}

/** The red rule draws in (scaleX) once 60% visible; the attribute is set on the node, no re-render. */
function DrawRule({ centered }: { centered: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
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
      { threshold: 0.6 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn('wwm-rule mt-4 block h-[3px]', centered ? 'w-[72px]' : 'w-24')}
      style={{ background: 'linear-gradient(90deg, var(--accent-primary), rgba(224,61,42,0.12))' }}
    />
  )
}

/** v1 section-heading.tsx: rotated red square, eyebrow, uppercase Bebas h2, drawn rule. */
export function SectionHeading({ eyebrow, title, description, id, align = 'left' }: SectionHeadingProps) {
  const centered = align === 'center'
  return (
    <div className={centered ? 'flex flex-col items-center text-center' : 'flex flex-col'}>
      <div className="mb-3 flex items-center gap-3">
        <span aria-hidden="true" className="block size-2 rotate-45 bg-[color:var(--accent-primary)]" />
        <p className="eyebrow text-accent-secondary tracking-[0.2em]">{eyebrow}</p>
      </div>
      <h2 id={id} className="font-heading uppercase text-primary text-[clamp(2.25rem,5.5vw,3.75rem)] leading-none tracking-[0.01em]">
        {title}
      </h2>
      <DrawRule centered={centered} />
      {description ? (
        <p className={cn('mt-4 text-body-m text-secondary', centered ? 'max-w-[540px]' : 'max-w-[56ch]')}>{description}</p>
      ) : null}
    </div>
  )
}
