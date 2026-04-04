"use client";

import { GrainGradient } from '@paper-design/shaders-react';
import { Section } from '@/ui-components';
import { motion } from 'framer-motion';

const EASE_SPRING = [0.16, 1, 0.3, 1] as const;

const STAT_CHIPS = [
  { label: '1,000+ Sounds' },
  { label: 'New Weekly' },
  { label: 'Instant Downloads' },
];

export function CollectionHeader() {
  return (
    <Section
      variant="standard"
      className="relative overflow-hidden"
      style={{ minHeight: '340px', paddingTop: '3rem', paddingBottom: '2rem' }}
    >
      {/* Animated grain texture — brand colors: black bg, red + beige grain */}
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
        <GrainGradient
          colorBack="#171717"
          colors={["#E03D2A", "#D4C4A8", "#C8351F", "#2a1a14"]}
          softness={0.55}
          intensity={0.35}
          noise={0.28}
          speed={0.6}
          shape="corners"
          style={{ width: "100%", height: "100%" }}
        />
        {/* Deepened fade bottom edge */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[var(--bg-canvas)]" />
      </div>

      {/* Content sits above the grain layer */}
      <div className="content-container relative z-10 flex flex-col gap-4 justify-center" style={{ minHeight: '280px' }}>

        {/* Animated eyebrow with decorative lines */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE_SPRING, delay: 0.05 }}
        >
          <span
            style={{
              display: 'block',
              height: '1px',
              width: '28px',
              background: 'var(--accent-primary)',
              opacity: 0.8,
            }}
          />
          <p
            style={{
              fontSize: '0.62rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--accent-secondary)',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
            }}
          >
            Collection
          </p>
          <span
            style={{
              display: 'block',
              height: '1px',
              width: '20px',
              background: 'var(--accent-primary)',
              opacity: 0.35,
            }}
          />
        </motion.div>

        {/* H1 — staggered word reveal */}
        <div style={{ overflow: 'hidden' }}>
          <motion.h1
            className="text-display-m md:text-display-xl text-[color:var(--accent-contrast)]"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: EASE_SPRING, delay: 0.15 }}
          >
            Pure Organic Sonics for ya head top!
          </motion.h1>
        </div>

        <motion.h2
          className="text-display-m text-[color:var(--accent-secondary)] md:text-display-l"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_SPRING, delay: 0.28 }}
        >
          Premium tools for modern producers.
        </motion.h2>

        <motion.p
          className="text-body-m text-[color:var(--accent-contrast)]/70 max-w-2xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE_SPRING, delay: 0.38 }}
        >
          Curated beats, kits, and sound design for late-night sessions. Built to sound expensive
          straight out of the box.
        </motion.p>

        {/* Animated stat chips */}
        <motion.div
          className="flex flex-wrap gap-2 mt-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_SPRING, delay: 0.5 }}
        >
          {STAT_CHIPS.map((chip) => (
            <span
              key={chip.label}
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(212,196,168,0.85)',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(224,61,42,0.2)',
                padding: '5px 12px',
                borderRadius: '999px',
                backdropFilter: 'blur(8px)',
              }}
            >
              {chip.label}
            </span>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}
