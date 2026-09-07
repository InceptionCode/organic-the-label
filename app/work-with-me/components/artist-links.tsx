import type { ComponentType, SVGProps } from "react";
import { ARTIST_LINKS, type ArtistPlatform } from "@/lib/work-with-me/content";
import { SectionHeading } from "./section-heading";
import { SpotifyGlyph, AppleMusicGlyph, YouTubeGlyph } from "./platform-icons";

const GLYPHS: Record<ArtistPlatform, ComponentType<SVGProps<SVGSVGElement>>> = {
  spotify: SpotifyGlyph,
  appleMusic: AppleMusicGlyph,
  youtube: YouTubeGlyph,
};

export function ArtistLinks() {
  const links = ARTIST_LINKS.filter((link) => link.url.trim().length > 0);
  if (links.length === 0) return null;

  return (
    <section className="content-container section-y-compact" aria-labelledby="wwm-links-title">
      <SectionHeading
        id="wwm-links-title"
        eyebrow="Listen"
        title="Find the catalog"
        description="Streaming and video homes for the released work."
      />

      <ul className="mt-8 flex flex-wrap gap-3">
        {links.map((link) => {
          const Glyph = GLYPHS[link.platform];
          return (
            <li key={`${link.platform}-${link.label}`}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="wwm-pill group inline-flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-body-s transition-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]"
                style={{
                  minHeight: "44px",
                  borderColor: "rgba(224,61,42,0.22)",
                  background: "var(--surface-1)",
                  color: "var(--text-secondary)",
                }}
              >
                <Glyph className="h-4 w-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
                <span className="group-hover:text-[color:var(--text-primary)]">{link.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
