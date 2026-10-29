import { ArrowUpRight, Music } from 'lucide-react'
import { SPOTIFY_EMBED_URL } from '~/lib/work-with-me-content'
import { spotifyEmbedSrc } from '~/lib/work-with-me-embeds'
import type { SpotifyRelease } from '~/server/social/spotify'
import { LazyVisual } from '~/ui/lazy-visual'
import { FlatHeading } from './flat-heading'

const EMBED_SRC = spotifyEmbedSrc(SPOTIFY_EMBED_URL)

/** Spotify artist embed: lazy iframe below the fold, so it never competes with the LCP. */
function Embed() {
  if (!EMBED_SRC) return null
  return (
    <iframe
      src={EMBED_SRC}
      title="JUICEMAN on Spotify"
      loading="lazy"
      className="h-[152px] w-full border-0"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
    />
  )
}

/**
 * Featured releases on the canvas. The image-stream corridor stays as the section's moving backdrop,
 * held back under a dark scrim so the flat cover grid (radius 0, titles below) reads first.
 */
export function FeaturedTracks({ releases }: { releases: SpotifyRelease[] }) {
  const items = releases.slice(0, 8)
  const covers = items.flatMap((r) => (r.imageUrl ? [{ src: r.imageUrl, alt: r.name }] : []))

  return (
    <section aria-labelledby="wwm-tracks-title" className="hairline-t hairline-b section-y-standard relative overflow-hidden bg-canvas">
      {covers.length > 0 ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-45">
          <LazyVisual className="size-full" load={() => import('./image-stream-hero')} poster={null} props={{ images: covers, cards: 8, speed: 26 }} />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 70% at 30% 45%, rgba(7,7,7,0.94) 0%, rgba(7,7,7,0.75) 55%, rgba(7,7,7,0.5) 100%), linear-gradient(180deg, rgba(7,7,7,0.6) 0%, rgba(7,7,7,0.3) 45%, rgba(7,7,7,0.8) 100%)',
            }}
          />
        </div>
      ) : null}

      <div className="content-container relative z-[1]">
        <FlatHeading id="wwm-tracks-title" title="Featured releases" className="mb-10 md:mb-14" />

        {items.length > 0 ? (
          <>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 md:gap-x-6 xl:grid-cols-6">
              {items.map((release) => (
                <li key={release.id}>
                  <a
                    href={release.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-4 focus-visible:ring-offset-[color:var(--bg-canvas)] active:opacity-80"
                  >
                    <span className="relative block aspect-square overflow-hidden bg-surface-1">
                      {release.imageUrl ? (
                        <img
                          src={release.imageUrl}
                          alt={release.name}
                          width={640}
                          height={640}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-[var(--ease-spring)] group-hover:scale-[1.02] motion-reduce:transition-none"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center">
                          <Music className="size-6 text-muted" aria-hidden="true" />
                        </span>
                      )}
                    </span>
                    <span className="mt-3 flex items-start justify-between gap-2">
                      <span className="min-w-0 truncate text-body-s font-medium text-primary">{release.name}</span>
                      <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted transition-colors duration-150 group-hover:text-[color:var(--text-primary)]" aria-hidden="true" />
                    </span>
                    <span className="mt-0.5 block text-label capitalize">
                      {release.releaseYear} · {release.albumType}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            {EMBED_SRC ? (
              <div className="mt-12">
                <p className="mb-4 text-label">Listen</p>
                <Embed />
              </div>
            ) : null}
          </>
        ) : EMBED_SRC ? (
          <Embed />
        ) : (
          <div className="hairline-t hairline-b flex max-w-xl flex-col items-start gap-2 py-8">
            <p className="text-h4 text-primary">Releases land here</p>
            <p className="max-w-[40ch] text-body-s text-secondary">Add a Spotify artist or playlist URL to stream recent productions.</p>
          </div>
        )}
      </div>
    </section>
  )
}
