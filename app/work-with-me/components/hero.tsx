"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/ui-components";
import type { SpotifyArtist } from "@/lib/spotify/artist";
import { HERO } from "@/lib/work-with-me/content";

const EASE_SPRING = [0.16, 1, 0.3, 1] as const;

type HeroProps = {
  onPrimaryCta: () => void;
  artist: SpotifyArtist | null;
};

const compactNumber = (n: number) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);

function HeroPortrait({ src, alt }: { src: string; alt: string }) {
  const useNextImage = src.startsWith("/") || src.startsWith("https://i.scdn.co/");
  if (useNextImage) {
    return (
      <Image src={src} alt={alt} fill priority sizes="(min-width: 900px) 46vw, 100vw" className="object-cover" />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />;
}

export function Hero({ onPrimaryCta, artist }: HeroProps) {
  const imageSrc = artist?.imageUrl ?? HERO.imageUrl;
  const imageAlt = artist ? `${artist.name}` : HERO.imageAlt;
  const genres = artist?.genres.slice(0, 3) ?? [];

  return (
    <section className="content-container-xl pt-10 pb-6 md:pt-14 md:pb-10" aria-labelledby="wwm-hero-title">
      <div
        className="relative grid overflow-hidden md:grid-cols-[1.08fr_0.92fr]"
        style={{
          borderRadius: "var(--radius-xl)",
          border: "1px solid rgba(224,61,42,0.28)",
          background: "var(--surface-1)",
          boxShadow: "0 0 0 1px rgba(224,61,42,0.10), var(--shadow-lg-premium)",
        }}
      >
        {/* Copy */}
        <div className="relative z-[2] flex flex-col justify-center gap-6 px-6 py-11 md:px-12 md:py-16">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_SPRING, delay: 0.1 }}
          >
            <motion.span
              aria-hidden
              className="block h-2 w-2 rounded-full"
              style={{ background: "var(--accent-primary)" }}
              animate={{ opacity: [1, 0.35, 1], scale: [1, 0.8, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
            <p className="eyebrow" style={{ color: "var(--accent-secondary)", letterSpacing: "0.2em" }}>
              {HERO.eyebrow}
            </p>
          </motion.div>

          <h1
            id="wwm-hero-title"
            className="text-primary"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2.75rem, 6vw, 4.75rem)",
              letterSpacing: "0.005em",
              lineHeight: 0.94,
              textTransform: "uppercase",
            }}
          >
            {HERO.titleLines.map((line, i) => (
              <span key={line} className="block overflow-hidden">
                <motion.span
                  className="block"
                  style={i === HERO.titleLines.length - 1 ? { color: "var(--accent-primary)" } : undefined}
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.8, ease: EASE_SPRING, delay: 0.22 + i * 0.13 }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.div
            aria-hidden
            className="h-[3px] origin-left"
            style={{
              background:
                "linear-gradient(90deg, var(--accent-primary) 0%, rgba(224,61,42,0.15) 100%)",
              maxWidth: "220px",
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, ease: EASE_SPRING, delay: 0.62 }}
          />

          <motion.p
            className="text-body-l text-secondary"
            style={{ maxWidth: "46ch" }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_SPRING, delay: 0.5 }}
          >
            {HERO.subcopy}
          </motion.p>

          <motion.div
            className="flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE_SPRING, delay: 0.64 }}
          >
            <Button size="lg" onClick={onPrimaryCta}>
              {HERO.ctaLabel}
            </Button>
            {artist && artist.followers > 0 && (
              <span className="meta">
                <span className="text-primary" style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem" }}>
                  {compactNumber(artist.followers)}
                </span>{" "}
                followers on Spotify
              </span>
            )}
          </motion.div>

          {genres.length > 0 && (
            <motion.ul
              className="flex flex-wrap gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              {genres.map((genre) => (
                <li
                  key={genre}
                  className="rounded-full px-3 py-1 text-caption capitalize"
                  style={{
                    background: "var(--accent-secondary-soft)",
                    color: "var(--accent-secondary)",
                    border: "1px solid rgba(212,196,168,0.22)",
                  }}
                >
                  {genre}
                </li>
              ))}
            </motion.ul>
          )}
        </div>

        {/* Portrait — red duotone treatment */}
        <div className="relative min-h-[340px] md:min-h-[560px]">
          <div className="absolute inset-0" style={{ filter: "grayscale(1) contrast(1.08)" }}>
            <HeroPortrait src={imageSrc} alt={imageAlt} />
          </div>
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: "var(--accent-primary)", mixBlendMode: "color", opacity: 0.55 }}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, var(--surface-1) 0%, rgba(30,30,30,0.15) 32%, transparent 60%), linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 45%)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: "200px",
            }}
          />
        </div>
      </div>
    </section>
  );
}
