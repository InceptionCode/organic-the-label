"use client";

import { motion } from "framer-motion";
import { Button } from "@/ui-components";
import type { SpotifyArtist } from "@/lib/spotify/artist";
import { HERO } from "@/lib/work-with-me/content";
import { ParticlePortrait } from "./particle-portrait";

const EASE_SPRING = [0.16, 1, 0.3, 1] as const;

type HeroProps = {
  onPrimaryCta: () => void;
  artist: SpotifyArtist | null;
};

const compactNumber = (n: number) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export function Hero({ onPrimaryCta, artist }: HeroProps) {
  const genres = artist?.genres.slice(0, 3) ?? [];

  return (
    <section
      className="relative isolate w-full overflow-hidden"
      aria-labelledby="wwm-hero-title"
      style={{
        background: "var(--bg-canvas)",
        borderBlock: "1px solid rgba(224,61,42,0.22)",
        minHeight: "600px",
      }}
    >
      <div className="md:h-[78vh] md:min-h-[620px] md:max-h-[880px]">
        {/* ── Visual layer — particle portrait, right side on desktop ── */}
        <div
          className="absolute inset-y-0 right-0 w-full md:w-[54%]"
          aria-hidden="true"
        >
          <ParticlePortrait imageUrl={artist?.imageUrl ?? null} wordmark="JUICEMAN" />
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 hidden w-44 md:block"
            style={{ background: "linear-gradient(90deg, var(--bg-canvas), transparent)" }}
          />
          <div
            aria-hidden
            className="absolute inset-0 md:hidden"
            style={{
              background:
                "linear-gradient(180deg, rgba(23,23,23,0.86) 0%, rgba(23,23,23,0.78) 45%, rgba(23,23,23,0.68) 100%)",
            }}
          />
        </div>

        <div className="content-container-xl relative z-[2] flex h-full items-center py-16 md:py-0">
          <div className="grid w-full items-center md:grid-cols-[1.05fr_0.95fr]">
            <div className="flex flex-col gap-6">
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

            <div aria-hidden className="hidden md:block" />
          </div>
        </div>
      </div>
    </section>
  );
}
