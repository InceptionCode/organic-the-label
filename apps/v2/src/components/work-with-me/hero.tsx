import type { CSSProperties } from 'react'
import { LazyParticlePortrait } from '~/components/visuals/lazy'
import { HERO } from '~/lib/work-with-me-content'
import type { SpotifyArtist } from '~/server/social/spotify'
import { buttonClasses } from '~/ui/button'

const compactNumber = (n: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

/** Staggered entrance as the shared os-hero-rise keyframes (transform and opacity only). */
const rise = (delay: number, distance: number, duration = 0.6) =>
  ({ '--delay': `${delay}s`, '--rise': `${distance}px`, '--dur': `${duration}s` }) as CSSProperties

/**
 * Work With Me hero, laid out like Home's: the particle portrait bleeds to the viewport edge on the
 * right half (a band above the headline below md), the Bebas headline is anchored bottom-left, and a
 * full-width hairline row carries the intro copy and the one primary CTA.
 */
export function Hero({ artist }: { artist: SpotifyArtist | null }) {
  const genres = artist?.genres.slice(0, 3) ?? []
  return (
    <section
      aria-labelledby="wwm-hero-title"
      className="relative isolate flex w-full flex-col overflow-hidden bg-canvas md:min-h-[calc(100svh-4rem)] lg:min-h-[calc(100svh-72px)]"
    >
      <div className="relative flex flex-1 flex-col md:justify-end">
        <div aria-hidden="true" className="relative h-[min(78vw,440px)] w-full md:absolute md:inset-y-0 md:right-0 md:h-auto md:w-1/2">
          <LazyParticlePortrait
            className="absolute inset-0"
            imageUrl={artist?.imageUrl ?? null}
            wordmark="JUICEMAN"
            media="(min-width: 768px)"
          />
          {/* Below md the particle visual is gated off (poster only), so the band shows the artist photo, static. */}
          {artist?.imageUrl ? (
            <img
              src={artist.imageUrl}
              alt=""
              width={640}
              height={640}
              decoding="async"
              className="absolute inset-0 size-full object-cover object-[50%_30%] opacity-80 grayscale md:hidden"
            />
          ) : null}
          {/* Fades into the canvas: toward the headline from md, toward the content below md. */}
          <div className="absolute inset-y-0 left-0 hidden w-40 md:block" style={{ background: 'linear-gradient(90deg, var(--bg-canvas), transparent)' }} />
          <div className="absolute inset-x-0 bottom-0 h-28" style={{ background: 'linear-gradient(0deg, var(--bg-canvas), transparent)' }} />
        </div>

        <div className="content-container relative z-[2] pb-8 pt-2 md:pt-24">
          <h1
            id="wwm-hero-title"
            className="font-heading uppercase text-primary text-[clamp(3.25rem,7.2vw,7.5rem)] leading-[0.9] tracking-[0.01em] md:max-w-[55%]"
          >
            {HERO.titleLines.map((line, i) => (
              <span key={line} className="block overflow-hidden">
                <span className="wwm-line" style={{ '--delay': `${0.22 + i * 0.13}s` } as CSSProperties}>
                  {line}
                </span>
              </span>
            ))}
          </h1>
        </div>
      </div>

      <div className="content-container relative z-[2] pb-10 md:pb-12">
        <div
          className="os-hero-rise hairline-t grid gap-6 pt-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end"
          style={rise(0.5, 16)}
        >
          <div className="flex flex-col gap-3">
            <p className="max-w-[52ch] text-body-l text-secondary">{HERO.subcopy}</p>
            {(artist && artist.followers > 0) || genres.length > 0 ? (
              <p className="text-label">
                {artist && artist.followers > 0 ? (
                  <>
                    <span className="text-primary">{compactNumber(artist.followers)}</span> followers on Spotify
                  </>
                ) : null}
                {artist && artist.followers > 0 && genres.length > 0 ? ' · ' : null}
                {genres.length > 0 ? <span className="capitalize">{genres.join(' · ')}</span> : null}
              </p>
            ) : null}
          </div>
          <a href="#work-with-me-inquiry" className={buttonClasses({ size: 'lg', className: 'w-full md:w-auto' })}>
            {HERO.ctaLabel}
          </a>
        </div>
      </div>
    </section>
  )
}
