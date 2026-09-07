"use client";

import { motion } from "framer-motion";
import { Button } from "@/ui-components";
import { HERO } from "@/lib/work-with-me/content";

const EASE_SPRING = [0.16, 1, 0.3, 1] as const;

type HeroProps = {
  onPrimaryCta: () => void;
};

export function Hero({ onPrimaryCta }: HeroProps) {
  return (
    <section
      className="content-container-xl pt-12 pb-8 md:pt-16 md:pb-12"
      aria-labelledby="wwm-hero-title"
    >
      <div
        className="grid overflow-hidden md:grid-cols-[1.05fr_0.95fr]"
        style={{
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border-subtle)",
          background: "var(--surface-1)",
          boxShadow: "var(--shadow-lg-premium)",
        }}
      >
        {/* Copy column */}
        <div className="flex flex-col justify-center gap-7 px-7 py-12 md:px-12 md:py-16">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_SPRING, delay: 0.1 }}
          >
            <span
              aria-hidden
              style={{ height: "1px", width: "32px", background: "var(--accent-primary)", opacity: 0.8 }}
            />
            <p
              className="eyebrow"
              style={{ color: "var(--accent-secondary)", letterSpacing: "0.18em" }}
            >
              {HERO.eyebrow}
            </p>
          </motion.div>

          <h1
            id="wwm-hero-title"
            className="text-primary"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2.75rem, 6vw, 4.75rem)",
              letterSpacing: "0.02em",
              lineHeight: 1.0,
              maxWidth: "14ch",
            }}
          >
            {HERO.titleLines.map((line, i) => (
              <motion.span
                key={line}
                className="block"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE_SPRING, delay: 0.24 + i * 0.12 }}
              >
                {line}
              </motion.span>
            ))}
          </h1>

          <motion.p
            className="text-body-l text-secondary"
            style={{ maxWidth: "46ch" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_SPRING, delay: 0.52 }}
          >
            {HERO.subcopy}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE_SPRING, delay: 0.66 }}
          >
            <Button size="lg" onClick={onPrimaryCta}>
              {HERO.ctaLabel}
            </Button>
          </motion.div>
        </div>

        <div className="relative min-h-[320px] md:min-h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO.imageUrl}
            alt={HERO.imageAlt}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.12) 45%, transparent 100%)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: "var(--accent-primary-soft)", mixBlendMode: "multiply" }}
          />
        </div>
      </div>
    </section>
  );
}
