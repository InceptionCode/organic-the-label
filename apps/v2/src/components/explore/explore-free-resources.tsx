import type { CSSProperties } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { ArrowUpRight } from 'lucide-react'
import { exploreQueries } from '~/queries/explore'
import { cn } from '~/ui/cn'
import { ExploreSectionLink, ExploreSplit, exploreFocusRing } from './explore-section-wrapper'
import type { ExploreSectionMetadata } from './explore-sections'

/** Active free resources as Home's typographic index: hairline rows, the whole row links to /free/{slug}. */
export function ExploreFreeResources({ metadata }: { metadata: ExploreSectionMetadata }) {
  const resources = useSuspenseQuery(exploreQueries.freeResources()).data
  return (
    <ExploreSplit
      id={`${metadata.id}-heading`}
      title="FREE RESOURCES"
      intro="Starter kits and tools you can get by email, free."
      action={<ExploreSectionLink href="/free">All free resources</ExploreSectionLink>}
    >
      <ul className="hairline-t">
        {resources.map((r, i) => (
          <li key={r.slug} className="os-reveal-item hairline-b" style={{ '--i': i } as CSSProperties}>
            <a
              href={`/free/${encodeURIComponent(r.slug)}`}
              className={cn(
                'group grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1 py-5 no-underline md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)_auto] md:py-6 active:opacity-80',
                exploreFocusRing,
              )}
            >
              <span className="text-h2 text-secondary transition-colors duration-[var(--motion-medium)] ease-[var(--ease-soft)] group-hover:text-[color:var(--text-primary)] group-focus-visible:text-[color:var(--text-primary)]">
                {r.name}
              </span>
              <span className="col-start-1 row-start-2 text-body-s text-muted md:col-start-2 md:row-start-1">
                {r.description ? <span className="line-clamp-2">{r.description}</span> : null}
                <span className="mt-1 block text-label text-[color:var(--text-secondary)]">Get it free</span>
              </span>
              <ArrowUpRight
                aria-hidden
                className="col-start-2 row-span-2 size-6 text-muted transition-transform duration-[var(--motion-medium)] ease-[var(--ease-spring)] group-hover:translate-x-1 group-hover:-translate-y-1 md:col-start-3 md:row-span-1"
              />
            </a>
          </li>
        ))}
      </ul>
    </ExploreSplit>
  )
}
