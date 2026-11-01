import type { CSSProperties } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { SERVICES } from '~/lib/work-with-me-content'
import type { WorkWithMeProjectType } from '~/server/support/schema'
import { cn } from '~/ui/cn'
import { FlatHeading } from './flat-heading'
import { requestProjectType } from './inquiry-form'

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]'

/** Service title to the inquiry form's project type. */
const PROJECT_TYPE: Record<string, WorkWithMeProjectType> = {
  'Mixing & Mastering': 'Mixing & Mastering',
  'Production Collabs': 'Collaboration',
  'Beat Leasing': 'Beat Leasing',
  'Production Suite': 'Production Suite',
}

/**
 * Services as a typographic index (Home's Browse by type). Each row jumps to the inquiry form with
 * that project type preselected; without JS the anchor still lands on the form.
 */
export function ServicesList() {
  return (
    <section aria-labelledby="wwm-services-title" className="content-container section-y-standard">
      <FlatHeading id="wwm-services-title" title="Ways to work together" className="mb-10 md:mb-14" />
      <ul className="hairline-t">
        {SERVICES.map((service, i) => {
          const type = PROJECT_TYPE[service.title] ?? 'General'
          return (
            <li key={service.title} className="os-reveal-item hairline-b" style={{ '--i': i } as CSSProperties}>
              <a
                href="#work-with-me-inquiry"
                onClick={() => requestProjectType(type)}
                className={cn(
                  'group grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1 py-5 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)_auto] md:py-6 active:opacity-80',
                  focusRing,
                )}
              >
                <span className="text-h2 text-secondary transition-colors duration-[var(--motion-medium)] ease-[var(--ease-soft)] group-hover:text-[color:var(--text-primary)] group-focus-visible:text-[color:var(--text-primary)]">
                  {service.title}
                </span>
                <span className="col-start-1 row-start-2 text-body-s text-muted md:col-start-2 md:row-start-1">{service.blurb}</span>
                <ArrowUpRight
                  aria-hidden
                  className="col-start-2 row-span-2 size-6 text-muted transition-transform duration-[var(--motion-medium)] ease-[var(--ease-spring)] group-hover:translate-x-1 group-hover:-translate-y-1 md:col-start-3 md:row-span-1"
                />
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
