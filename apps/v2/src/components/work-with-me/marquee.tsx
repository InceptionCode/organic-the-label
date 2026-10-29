import { useEffect, useState } from 'react'
import { SERVICES, SERVICES_HEADING } from '~/lib/work-with-me-content'
import { SERVICE_ICONS } from './service-icons'

const ROTATE_MS = 4600

function ServiceCard({ service }: { service: (typeof SERVICES)[number] }) {
  const Icon = SERVICE_ICONS[service.icon]
  return (
    <span className="wwm-card flex shrink-0 items-center gap-3 px-5 py-4">
      <span className="flex size-11 items-center justify-center rounded-[var(--radius-md)] border border-[rgba(224,61,42,0.2)] bg-accent-soft text-accent">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="whitespace-nowrap font-heading text-[1.4rem] leading-none tracking-[0.03em] text-primary">{service.title}</span>
    </span>
  )
}

/** v1 marquee.tsx: heading, rotating current service (aria-live), red rule, infinite card track. */
export function Marquee() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (SERVICES.length <= 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => {
      // Stop advancing while the tab is hidden.
      if (!document.hidden) setActive((i) => (i + 1) % SERVICES.length)
    }, ROTATE_MS)
    return () => window.clearInterval(timer)
  }, [])

  const current = SERVICES[active]!
  const tripled = [...SERVICES, ...SERVICES, ...SERVICES]

  return (
    <section
      aria-label="Services"
      className="relative w-full overflow-hidden"
      style={{
        background:
          'linear-gradient(90deg, rgba(224,61,42,0.16) 0%, rgba(23,23,23,0) 28%, rgba(23,23,23,0) 72%, rgba(224,61,42,0.16) 100%), var(--surface-1)',
        borderTop: '1px solid rgba(224,61,42,0.28)',
        borderBottom: '1px solid rgba(224,61,42,0.28)',
      }}
    >
      <div className="content-container-xl py-8 md:py-10">
        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr] lg:items-center lg:gap-10">
          <h2 className="font-heading text-primary text-[clamp(1.9rem,4vw,3rem)] leading-[1.02] tracking-[0.01em] [text-wrap:balance]">
            {SERVICES_HEADING}
          </h2>
          <div aria-live="polite" className="lg:text-right">
            <div key={current.title} className="wwm-swap">
              <p className="font-heading text-[1.5rem] tracking-[0.02em] text-primary">{current.title}</p>
              <p className="mt-1 max-w-[42ch] text-body-s leading-[1.55] text-secondary lg:ml-auto">{current.blurb}</p>
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="mt-6 h-0.5" style={{ background: 'linear-gradient(90deg, var(--accent-primary), rgba(224,61,42,0.15))' }} />
      </div>

      <div className="wwm-marquee relative flex select-none overflow-hidden pb-6" role="presentation">
        <div className="wwm-marquee-track gap-4 pl-4" aria-hidden="true">
          {tripled.map((service, i) => (
            <ServiceCard key={`a-${i}`} service={service} />
          ))}
          {tripled.map((service, i) => (
            <ServiceCard key={`b-${i}`} service={service} />
          ))}
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-24 md:w-40" style={{ background: 'linear-gradient(90deg, var(--surface-1) 15%, transparent)' }} />
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-24 md:w-40" style={{ background: 'linear-gradient(270deg, var(--surface-1) 15%, transparent)' }} />
      </div>
    </section>
  )
}
