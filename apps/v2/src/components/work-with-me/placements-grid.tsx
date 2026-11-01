import type { CSSProperties } from 'react'
import { ArrowUpRight, Music } from 'lucide-react'
import type { EnrichedPlacement } from '~/server/social/work-with-me'
import { cn } from '~/ui/cn'
import { FlatHeading } from './flat-heading'
import { MusoCredits } from './muso-credits'

const keyOf = (p: EnrichedPlacement) => `${p.artist}-${p.track}`
const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]'

/**
 * Placements as credit rows (small square art, role, "Artist · Track", Spotify link) beside the
 * unboxed Muso.ai discography. Rows instead of large tiles: the placements often share one cover, which
 * read as the same image three times at tile size.
 */
function PlacementRow({ placement, index }: { placement: EnrichedPlacement; index: number }) {
  const label = `${placement.artist} · ${placement.track}`
  const body = (
    <>
      <span className="relative size-16 shrink-0 overflow-hidden bg-surface-1 sm:size-20">
        {placement.artworkUrl ? (
          <img
            src={placement.artworkUrl}
            alt=""
            width={160}
            height={160}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-[var(--ease-spring)] group-hover:scale-[1.02] motion-reduce:transition-none"
          />
        ) : (
          <span className="flex size-full items-center justify-center">
            <Music className="size-6 text-muted" aria-hidden="true" />
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-label">{placement.role}</span>{' '}
        <span className="text-h4 text-secondary transition-colors duration-150 [overflow-wrap:anywhere] group-hover:text-[color:var(--text-primary)] group-focus-visible:text-[color:var(--text-primary)]">
          {label}
        </span>
      </span>
      {placement.href ? (
        <ArrowUpRight
          aria-hidden="true"
          className="size-5 shrink-0 text-muted transition-transform duration-[var(--motion-medium)] ease-[var(--ease-spring)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      ) : null}
    </>
  )
  const rowClass = 'group flex min-h-14 items-center gap-4 py-4 sm:gap-5'
  return (
    <li className="os-reveal-item hairline-b" style={{ '--i': index } as CSSProperties}>
      {placement.href ? (
        <a
          href={placement.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(rowClass, 'active:opacity-80', focusRing)}
        >
          {body}
          {/* Name from content (role, then title, as shown), so it contains the visible text (WCAG 2.5.3). */}
          <span className="sr-only">, open on Spotify</span>
        </a>
      ) : (
        <div className={rowClass}>{body}</div>
      )}
    </li>
  )
}

export function PlacementsGrid({ placements }: { placements: EnrichedPlacement[] }) {
  const shown = placements.slice(0, 3)

  return (
    <section aria-labelledby="wwm-placements-title" className="content-container section-y-standard">
      <FlatHeading
        id="wwm-placements-title"
        title="Placements & credits"
        description={
          shown.length > 0
            ? 'Selected records, then the full verified discography.'
            : 'The full verified discography, straight from Muso.ai.'
        }
        className="mb-10 md:mb-14"
      />

      <div className={cn('grid gap-12 lg:gap-8', shown.length > 0 && 'lg:grid-cols-12')}>
        {shown.length > 0 ? (
          <div className="lg:col-span-6">
            <p className="mb-4 text-label">Selected work</p>
            <ul className="hairline-t">
              {shown.map((p, index) => (
                <PlacementRow key={keyOf(p)} placement={p} index={index} />
              ))}
            </ul>
          </div>
        ) : null}

        <div className={shown.length > 0 ? 'lg:col-span-5 lg:col-start-8' : 'max-w-[560px]'}>
          {shown.length > 0 ? <p className="mb-4 text-label">Full discography</p> : null}
          <MusoCredits />
        </div>
      </div>
    </section>
  )
}
