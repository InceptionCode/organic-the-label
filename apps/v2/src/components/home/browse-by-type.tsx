import type { CSSProperties } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { BROWSE_CATEGORIES } from '~/lib/constants'
import { cn } from '~/ui/cn'

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]'

/** Categories as a typographic index: hairline rows, the whole row is the link. */
export function BrowseByType() {
  return (
    <section aria-labelledby="browse-heading" className="section-y-standard">
      <div className="content-container">
        <div className="mb-10 flex items-end justify-between gap-6 md:mb-14">
          <h2 id="browse-heading" className="text-display-m text-primary">
            BROWSE BY TYPE
          </h2>
          <Link to="/store" className={cn('link-underline inline-flex min-h-11 items-center rounded-sm text-body-s text-primary', focusRing)}>
            View all
          </Link>
        </div>

        <ul className="hairline-t">
          {BROWSE_CATEGORIES.map((cat, i) => (
            <li key={cat.label} className="os-reveal-item hairline-b" style={{ '--i': i } as CSSProperties}>
              <Link
                to="/store"
                search={cat.search}
                className={cn(
                  'group grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1 py-5 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)_auto] md:py-6 active:opacity-80',
                  focusRing,
                )}
              >
                <span className="text-h2 text-secondary transition-colors duration-[var(--motion-medium)] ease-[var(--ease-soft)] group-hover:text-[color:var(--text-primary)] group-focus-visible:text-[color:var(--text-primary)]">
                  {cat.label}
                </span>
                <span className="col-start-1 row-start-2 text-body-s text-muted md:col-start-2 md:row-start-1">{cat.description}</span>
                <ArrowUpRight
                  aria-hidden
                  className="col-start-2 row-span-2 size-6 text-muted transition-transform duration-[var(--motion-medium)] ease-[var(--ease-spring)] group-hover:translate-x-1 group-hover:-translate-y-1 md:col-start-3 md:row-span-1"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
