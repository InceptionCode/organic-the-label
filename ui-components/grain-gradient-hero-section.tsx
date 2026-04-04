"use client";

import { GrainGradient } from '@paper-design/shaders-react';
import { Button } from '@/ui-components/button';

interface GrainHeroSectionProps {
  title: string;
  subtitle: string;
  ctaLabel: string;
  onCtaClick: () => void;
}

export default function GrainHeroSection({
  title,
  subtitle,
  ctaLabel,
  onCtaClick,
}: GrainHeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Brand-colored animated grain gradient — dark: black bg, red + beige accents */}
      <GrainGradient
        colorBack="#171717"
        colors={["#E03D2A", "#D4C4A8", "#C8351F", "#8A7250"]}
        softness={0.6}
        intensity={0.45}
        noise={0.3}
        speed={0.6}
        shape="corners"
        style={{ position: "fixed", inset: 0, zIndex: -10 }}
      />

      <div className="text-center px-6 sm:px-8 max-w-4xl mx-auto">
        <h1
          role="heading"
          className="text-display-xl text-[color:var(--accent-contrast)] mb-6"
        >
          {title}
        </h1>

        <p className="max-w-2xl text-body-l text-[color:var(--text-muted)] mx-auto mb-8">
          {subtitle}
        </p>

        <Button
          onClick={onCtaClick}
          size="lg"
          className="text-base px-8 py-3 bg-[color:var(--accent-primary)] text-[color:var(--accent-contrast)] hover:bg-[color:var(--accent-primary-hover)] border-0"
        >
          {ctaLabel}
        </Button>
      </div>
    </section>
  );
}
