import Image from "next/image";
import { Music, ArrowUpRight } from "lucide-react";
import type { SpotifyRelease } from "@/lib/spotify/artist";
import { spotifyEmbedSrc } from "@/lib/work-with-me/embeds";
import { SPOTIFY_EMBED_URL } from "@/lib/work-with-me/content";

type FeaturedTracksProps = {
  releases: SpotifyRelease[];
};

const GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

function Embed() {
  const src = spotifyEmbedSrc(SPOTIFY_EMBED_URL);
  if (!src) return null;
  return (
    <div
      className="overflow-hidden"
      style={{
        height: "352px",
        borderRadius: "var(--radius-lg)",
        background: "rgba(0,0,0,0.35)",
        border: "1px solid rgba(233,220,198,0.14)",
      }}
    >
      <iframe
        src={src}
        title="JUICEMAN — featured tracks on Spotify"
        loading="lazy"
        className="h-full w-full border-0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      />
    </div>
  );
}

export function FeaturedTracks({ releases }: FeaturedTracksProps) {
  const items = releases.slice(0, 6);
  const hasEmbed = Boolean(spotifyEmbedSrc(SPOTIFY_EMBED_URL));

  return (
    <section
      className="relative overflow-hidden section-y-standard"
      aria-labelledby="wwm-tracks-title"
      style={{
        background:
          "radial-gradient(ellipse 80% 55% at 12% 0%, rgba(224,61,42,0.32) 0%, transparent 58%), linear-gradient(160deg, #2A100C 0%, #1A0A08 55%, #150807 100%)",
        borderTop: "1px solid rgba(224,61,42,0.35)",
        borderBottom: "1px solid rgba(224,61,42,0.35)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{ backgroundImage: GRAIN, backgroundSize: "200px" }}
      />

      <div className="content-container relative">
        <div className="mb-3 flex items-center gap-3">
          <span aria-hidden className="block h-2 w-2 rotate-45" style={{ background: "var(--accent-primary)" }} />
          <p className="eyebrow" style={{ color: "#E9DCC6", letterSpacing: "0.2em" }}>
            Proof of work
          </p>
        </div>
        <h2
          id="wwm-tracks-title"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(2.5rem, 6vw, 4.25rem)",
            letterSpacing: "0.01em",
            lineHeight: 0.98,
            textTransform: "uppercase",
            color: "#FBF7F0",
          }}
        >
          Featured releases
        </h2>

        {items.length > 0 ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12 lg:items-start">
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {items.map((release) => (
                <li key={release.id}>
                  <a
                    href={release.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <span
                      className="relative block aspect-square overflow-hidden rounded-[var(--radius-md)]"
                      style={{ border: "1px solid rgba(233,220,198,0.14)" }}
                    >
                      {release.imageUrl ? (
                        <Image
                          src={release.imageUrl}
                          alt={release.name}
                          fill
                          sizes="(min-width: 1024px) 14vw, (min-width: 640px) 22vw, 42vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
                          <Music className="h-6 w-6" style={{ color: "rgba(233,220,198,0.4)" }} aria-hidden />
                        </span>
                      )}
                      <span
                        aria-hidden
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                        style={{ background: "var(--accent-primary)" }}
                      >
                        <ArrowUpRight className="h-4 w-4" style={{ color: "#fff" }} />
                      </span>
                    </span>
                    <span className="mt-2 block truncate text-body-s" style={{ color: "#FBF7F0" }}>
                      {release.name}
                    </span>
                    <span className="block text-caption capitalize" style={{ color: "rgba(233,220,198,0.55)" }}>
                      {release.releaseYear} · {release.albumType}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <Embed />
          </div>
        ) : hasEmbed ? (
          <div className="mt-8 max-w-3xl">
            <Embed />
          </div>
        ) : (
          <div
            className="mt-8 flex max-w-xl flex-col items-start gap-3 rounded-[var(--radius-lg)] p-6"
            style={{ background: "rgba(0,0,0,0.28)", border: "1px solid rgba(233,220,198,0.14)" }}
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full"
              style={{ background: "var(--accent-primary-soft)", color: "var(--accent-primary)" }}
            >
              <Music className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-h5" style={{ color: "#FBF7F0" }}>
              Releases land here
            </p>
            <p className="text-body-s" style={{ color: "rgba(233,220,198,0.7)", maxWidth: "40ch" }}>
              Add a Spotify artist or playlist URL to stream recent productions.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
