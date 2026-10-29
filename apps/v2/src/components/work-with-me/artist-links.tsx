import type { ComponentType, SVGProps } from 'react'
import { ARTIST_LINKS, type ArtistPlatform } from '~/lib/work-with-me-content'
import { FlatHeading } from './flat-heading'
import { AppleMusicGlyph, SpotifyGlyph, YouTubeGlyph } from './platform-icons'

const GLYPHS: Record<ArtistPlatform, ComponentType<SVGProps<SVGSVGElement>>> = {
  spotify: SpotifyGlyph,
  appleMusic: AppleMusicGlyph,
  youtube: YouTubeGlyph,
}

/** Streaming and video homes as a row of plain text links with their platform glyphs. */
export function ArtistLinks() {
  return (
    <section aria-labelledby="wwm-links-title" className="content-container section-y-compact">
      <FlatHeading id="wwm-links-title" title="Find the catalog" description="Streaming and video homes for the released work." />
      <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-2">
        {ARTIST_LINKS.map((link) => {
          const Glyph = GLYPHS[link.platform]
          return (
            <li key={link.label}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline group inline-flex min-h-11 items-center gap-2.5 rounded-sm text-body-m text-primary outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)] active:opacity-70"
              >
                <Glyph className="size-4 shrink-0 text-[color:var(--text-secondary)] transition-colors duration-150 group-hover:text-[color:var(--accent-text)]" />
                {link.label}
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
