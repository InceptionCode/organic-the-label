"use client";

import { GrainGradient } from '@paper-design/shaders-react';
import { Section } from '@/ui-components';

export function CollectionHeader() {
  return (
    <Section variant="standard" className="pb-4 pt-0 relative overflow-hidden">
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
        {/* Fade bottom edge to blend into page */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-[var(--bg-canvas)]" />
      </div>

      {/* Content sits above the grain layer */}
      <div className="content-container space-y-3 relative z-10">
        <p className="eyebrow text-[color:var(--accent-secondary)]">Store</p>
        <h1 className="text-display-m md:text-display-xl text-[color:var(--accent-contrast)]">
          Pure Organic Sonics for ya head top!
        </h1>
        <h2 className="text-display-m text-[color:var(--accent-secondary)] md:text-display-l">
          Premium tools for modern producers.
        </h2>
        <p className="text-body-m text-[color:var(--accent-contrast)]/70 max-w-2xl">
          Curated beats, kits, and sound design for late-night sessions. Built to sound expensive
          straight out of the box.
        </p>
      </div>
    </Section>
  );
}
