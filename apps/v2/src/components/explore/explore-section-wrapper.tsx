import type { ReactNode } from 'react'
import { cn } from '~/ui/cn'
import { RevealSection } from '~/ui/reveal-section'
import type { ExploreSectionMetadata } from './explore-sections'

export const exploreFocusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]'

/**
 * One full-width flat section per registry entry, separated by hairlines and named by its visible
 * heading (`${id}-heading`). `sand` is the page's single sand band (the membership pitch); `hero`
 * sits flush under the page header and skips the scroll fade-in (it is above the fold).
 */
export function ExploreSectionWrapper({
  metadata,
  variant = 'standard',
  children,
}: {
  metadata: ExploreSectionMetadata
  variant?: 'hero' | 'standard' | 'sand'
  children: ReactNode
}) {
  const content = <div className="content-container">{children}</div>
  return (
    <section
      id={metadata.id}
      aria-labelledby={`${metadata.id}-heading`}
      className={cn(
        variant === 'hero' && 'hairline-t py-8 md:py-10',
        variant === 'standard' && 'hairline-t section-y-standard',
        variant === 'sand' && 'band-sand section-y-standard',
      )}
    >
      {variant === 'hero' ? content : <RevealSection threshold={0.08} distance={32}>{content}</RevealSection>}
    </section>
  )
}

/**
 * Home's label-column layout: heading, intro and a small link on the left (3 of 12 on lg), the
 * content on the right. Below lg the heading row stacks above the content.
 */
export function ExploreSplit({
  id,
  title,
  intro,
  action,
  children,
}: {
  id: string
  title: string
  intro?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="flex flex-col gap-3 lg:col-span-3">
        <h2 id={id} className="text-h1 text-primary">
          {title}
        </h2>
        {intro && <p className="max-w-[40ch] text-body-s text-secondary">{intro}</p>}
        {action && <div className="lg:mt-2">{action}</div>}
      </div>
      <div className="min-w-0 lg:col-span-9">{children}</div>
    </div>
  )
}

/** The small "see all" link in a section's label column. */
export function ExploreSectionLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className={cn('link-underline inline-flex min-h-11 items-center rounded-sm text-body-s text-primary', exploreFocusRing)}>
      {children}
    </a>
  )
}
