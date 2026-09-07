"use client";

import { useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { RevealSection } from "@/app/components/reveal-section";
import { Hero } from "./components/hero";
import { BioRow } from "./components/bio-row";
import { ArtistLinks } from "./components/artist-links";
import { RecentPosts } from "./components/recent-posts";
import { PlacementsGrid } from "./components/placements-grid";
import { ServicesList } from "./components/services-list";
import { FeaturedTracks } from "./components/featured-tracks";
import { InquiryForm } from "./components/inquiry-form";
import { CtaBand } from "./components/cta-band";

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export function WorkWithMeClient() {
  const inquiryRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const scrollToForm = () => {
    inquiryRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <main className="relative w-full" style={{ background: "var(--bg-canvas)" }}>
      {/* Ambient backdrop */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background: `
            radial-gradient(ellipse 50% 35% at 50% -8%, rgba(224,61,42,0.09) 0%, transparent 70%),
            radial-gradient(ellipse 30% 25% at 15% 88%, rgba(212,196,168,0.06) 0%, transparent 60%)
          `,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0.02,
          backgroundImage: GRAIN_SVG,
          backgroundRepeat: "repeat",
          backgroundSize: "200px",
        }}
      />

      <div className="relative" style={{ zIndex: 1 }}>
        <Hero onPrimaryCta={scrollToForm} />

        <RevealSection threshold={0.08}>
          <BioRow onCta={scrollToForm} />
        </RevealSection>

        <RevealSection threshold={0.08}>
          <ArtistLinks />
        </RevealSection>

        <RevealSection threshold={0.08}>
          <RecentPosts />
        </RevealSection>

        <RevealSection threshold={0.08}>
          <PlacementsGrid />
        </RevealSection>

        <RevealSection threshold={0.08}>
          <ServicesList />
        </RevealSection>

        <RevealSection threshold={0.08}>
          <FeaturedTracks />
        </RevealSection>

        <div ref={inquiryRef} id="work-with-me-inquiry" className="scroll-mt-24 section-y-standard">
          <RevealSection threshold={0.06}>
            <InquiryForm />
          </RevealSection>
        </div>

        <CtaBand onCta={scrollToForm} />
      </div>
    </main>
  );
}
