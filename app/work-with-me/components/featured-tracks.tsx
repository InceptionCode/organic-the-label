import Image from "next/image";
import { Music, ArrowUpRight } from "lucide-react";
import type { SpotifyRelease } from "@/lib/spotify/artist";
import { spotifyEmbedSrc } from "@/lib/work-with-me/embeds";
import { SPOTIFY_EMBED_URL } from "@/lib/work-with-me/content";
import { ImageStreamHero, type StreamImage } from "./image-stream-hero";

type FeaturedTracksProps = {
  releases: SpotifyRelease[];
};

const GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;


function Embed() {
  const src = spotifyEmbedSrc(SPOTIFY_EMBED_URL);
  if (!src) return null;
  return (
    <iframe
      src={src}
      title="JUICEMAN on Spotify"
      loading="lazy"
      className="w-full border-0"
      style={{ height: "152px", borderRadius: "var(--radius-lg)" }}
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
    />
  );
}

export function FeaturedTracks({ releases }: FeaturedTracksProps) {
  const items = releases.slice(0, 8);
  const hasEmbed = Boolean(spotifyEmbedSrc(SPOTIFY_EMBED_URL));
  const covers: StreamImage[] = items
    .map((r) => ({ src: r.imageUrl ?? "", alt: r.name }))
    .filter((x) => x.src.length > 0);

  const content = (
    <>
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
        <>
          <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
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
                        sizes="(min-width: 1280px) 15vw, (min-width: 768px) 22vw, (min-width: 640px) 30vw, 45vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center" style={{ background: "#000000" }}>
                        <Music className="h-6 w-6" style={{ color: "rgba(212,196,168,0.4)" }} aria-hidden />
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

          {hasEmbed && (
            <div className="mt-10">
              <p className="eyebrow mb-3" style={{ color: "#E9DCC6" }}>
                Listen
              </p>
              <Embed />
            </div>
          )}
        </>
      ) : hasEmbed ? (
        <div className="mt-8">
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
    </>
  );

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

      {covers.length > 0 ? (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <ImageStreamHero images={covers} cards={8} speed={26} className="h-full w-full">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 78% 68% at 26% 40%, rgba(11,7,6,0.92) 0%, rgba(13,7,6,0.66) 50%, rgba(20,8,7,0.34) 100%), linear-gradient(180deg, rgba(15,8,7,0.55) 0%, rgba(15,8,7,0.35) 45%, rgba(15,8,7,0.7) 100%)",
              }}
            />
          </ImageStreamHero>
        </div>
      ) : null}

      <div className="content-container relative z-[1]">{content}</div>
    </section>
  );
}
