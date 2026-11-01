import { useState, useSyncExternalStore, type ReactNode } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import { safeExternalHref } from '~/lib/embed-url'
import {
  COMPOSITION_PAGE_SIZE,
  hasActiveCompositionFilters,
  toCompositionListParams,
  type CompositionSearch,
} from '~/lib/composition-search'
import { compositionQueries } from '~/queries/compositions'
import type { CompositionListItem } from '~/server/compositions/columns'
import { Button } from '~/ui/button'
import { cn } from '~/ui/cn'
import { RevealSection } from '~/ui/reveal-section'
import { formatPostedAt } from './composition-card'
import { CompositionRow } from './composition-row'
import { SocialEmbed } from './social-embed'

const LG_QUERY = '(min-width: 1024px)'

function subscribeLg(onChange: () => void) {
  const media = window.matchMedia(LG_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

/** lg and up: the sticky video panel exists. False on the server, so no embed renders before hydration. */
function useIsDesktop() {
  return useSyncExternalStore(subscribeLg, () => window.matchMedia(LG_QUERY).matches, () => false)
}

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]'

// Navbar (72px) + loops bar (58px) + 24px.
const PANEL_TOP = 'lg:top-[9.625rem]'

/**
 * Split layout: loop rows on the left; from lg a sticky panel on the right shows the selected loop's
 * video (one iframe at a time). Below lg each row opens its own video inline, one at a time.
 */
export function CompositionResults({ search }: { search: CompositionSearch }) {
  const compositions = useSuspenseQuery(compositionQueries.list(toCompositionListParams(search))).data
  const filtered = hasActiveCompositionFilters(search)
  const desktop = useIsDesktop()
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [watchingSlug, setWatchingSlug] = useState<string | null>(null)

  if (compositions.length === 0) {
    return filtered ? (
      <CompositionMessage title="No loops match your filters" body="Try a wider date range or clearing a tag.">
        <Link to="/compositions" search={{}} resetScroll={false} className={cn('link-underline mt-6 inline-flex min-h-11 items-center rounded-sm text-body-m text-primary', focusRing)}>
          Clear filters
        </Link>
      </CompositionMessage>
    ) : (
      <CompositionMessage title="No loops posted yet" body="Check back soon. New previews land here regularly." />
    )
  }

  // A filter change can drop the selected loop; fall back to the first one.
  const selected = compositions.find((c) => c.slug === selectedSlug) ?? compositions[0]!

  return (
    <div className="grid grid-cols-1 gap-x-12 lg:grid-cols-12 xl:gap-x-16">
      <div className="lg:col-span-7">
        <div data-testid="composition-grid" className="hairline-b">
          {compositions.map((composition) => (
            // id + scroll-mt: /compositions#slug deep links land below the navbar and the sticky loops bar.
            <div key={composition.id} id={composition.slug} className="hairline-t scroll-mt-40">
              <RevealSection distance={24} threshold={0.1}>
                <CompositionRow
                  composition={composition}
                  selected={composition.slug === selected.slug}
                  desktop={desktop}
                  watching={watchingSlug === composition.slug}
                  onSelect={() => setSelectedSlug(composition.slug)}
                  onWatch={() => {
                    setSelectedSlug(composition.slug)
                    if (!desktop) setWatchingSlug((open) => (open === composition.slug ? null : composition.slug))
                  }}
                />
              </RevealSection>
            </div>
          ))}
        </div>
        <p className="mt-8 text-label">
          Showing {compositions.length} {compositions.length === 1 ? 'loop' : 'loops'}
          {compositions.length === COMPOSITION_PAGE_SIZE ? '. Filter to narrow further.' : ''}
        </p>
      </div>

      {/* The column always exists from lg (no layout shift at hydration); the iframe mounts on the client only. */}
      <aside id="composition-video-panel" aria-label="Video" className={cn('hidden lg:col-span-5 lg:block')}>
        <div className={cn('sticky', PANEL_TOP)}>{desktop && <VideoPanel composition={selected} />}</div>
      </aside>
    </div>
  )
}

function VideoPanel({ composition }: { composition: CompositionListItem }) {
  const href = safeExternalHref(composition.embed_url)
  const platform = composition.platform === 'youtube' ? 'YouTube' : 'Instagram'
  return (
    // Keyed by slug: switching loops remounts the embed with a short fade (opacity only).
    <figure key={composition.slug} className="os-fade-in">
      <SocialEmbed variant="panel" platform={composition.platform} url={composition.embed_url} title={composition.title} />
      <figcaption className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-h4 text-primary">{composition.title}</p>
          <p className="mt-1 text-label">
            {platform} · {formatPostedAt(composition.posted_at)}
          </p>
        </div>
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn('inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-sm text-body-s text-secondary no-underline transition-colors duration-150 hover:text-[color:var(--text-primary)]', focusRing)}
          >
            <span className="link-underline">Open on {platform}</span>
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        )}
      </figcaption>
    </figure>
  )
}

function CompositionMessage({ title, body, tone = 'neutral', children }: { title: string; body: string; tone?: 'neutral' | 'error'; children?: ReactNode }) {
  return (
    <div role={tone === 'error' ? 'alert' : undefined} className="hairline-t hairline-b flex min-h-[40dvh] flex-col items-start justify-center py-16">
      <h2 className="text-h2 text-primary">{title}</h2>
      <p className="mt-3 max-w-md text-body-m text-secondary">{body}</p>
      {children}
    </div>
  )
}

export function CompositionError() {
  const router = useRouter()
  return (
    <CompositionMessage tone="error" title="Couldn't load the loops" body="Something went wrong on our end. Refresh the page or try again in a moment.">
      <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
        <Button onClick={() => void router.invalidate()}>Try again</Button>
        <Link to="/" className={cn('link-underline inline-flex min-h-11 items-center rounded-sm text-body-m text-primary', focusRing)}>
          Back to home
        </Link>
      </div>
    </CompositionMessage>
  )
}

export function CompositionResultsSkeleton() {
  const bar = 'animate-pulse bg-surface-2 motion-reduce:animate-none'
  return (
    <div role="status" aria-label="Loading loops" className="grid grid-cols-1 gap-x-12 lg:grid-cols-12 xl:gap-x-16">
      <div className="hairline-b lg:col-span-7">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={cn('hairline-t space-y-3 py-7 pl-5 md:pl-6', i >= 2 && 'hidden md:block')}>
            <div className={cn(bar, 'h-3 w-40')} />
            <div className={cn(bar, 'h-7 w-2/3')} />
            <div className={cn(bar, 'h-4 w-full max-w-md')} />
            <div className={cn(bar, 'mt-5 h-11 w-full')} />
          </div>
        ))}
      </div>
      <div className="hidden lg:col-span-5 lg:block">
        <div className={cn(bar, 'h-[min(720px,calc(100svh-15.5rem))] max-w-full')} style={{ aspectRatio: '400 / 720' }} />
      </div>
      <span className="sr-only">Loading loops</span>
    </div>
  )
}
