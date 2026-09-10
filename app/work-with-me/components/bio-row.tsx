import { Button } from "@/ui-components";
import type { SpotifyArtist } from "@/lib/spotify/artist";
import { BIO } from "@/lib/work-with-me/content";
import { SectionHeading } from "./section-heading";

type BioRowProps = {
  onCta: () => void;
  artist: SpotifyArtist | null;
};

export function BioRow({ onCta, artist }: BioRowProps) {
  return (
    <section className="content-container section-y-standard" aria-labelledby="wwm-bio-title">
      <div className="max-w-3xl">
        <SectionHeading id="wwm-bio-title" eyebrow="About" title={BIO.heading} />

        {artist && (
          <p
            className="mt-4 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-caption"
            style={{
              background: "var(--accent-primary-soft)",
              color: "var(--accent-primary)",
              border: "1px solid rgba(224,61,42,0.22)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent-primary)" }} />
            Verified artist on Spotify
          </p>
        )}

        <div className="mt-5 flex flex-col gap-4">
          {BIO.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-body-l text-secondary">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-7 pl-4" style={{ borderLeft: "3px solid var(--accent-primary)" }}>
          <p className="eyebrow" style={{ color: "var(--accent-secondary)" }}>
            The platform
          </p>
          <p className="text-body-s text-muted mt-2" style={{ lineHeight: 1.65 }}>
            {BIO.platformNote}
          </p>
        </div>

        <Button variant="outline" onClick={onCta} className="mt-8 w-fit">
          {BIO.ctaLabel}
        </Button>
      </div>
    </section>
  );
}
