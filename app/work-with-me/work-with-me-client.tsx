"use client";

import { useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { RevealSection } from "@/app/components/reveal-section";
import type { WorkWithMeSpotify } from "@/lib/work-with-me/spotify-data";
import type { RecentPostsData } from "@/lib/work-with-me/recent-posts-data";
import { Hero } from "./components/hero";
import { Marquee } from "./components/marquee";
import { BioRow } from "./components/bio-row";
import { PlacementsGrid } from "./components/placements-grid";
import { ArtistLinks } from "./components/artist-links";
import { RecentPosts } from "./components/recent-posts";
import { ServicesList } from "./components/services-list";
import { FeaturedTracks } from "./components/featured-tracks";
import { InquiryForm } from "./components/inquiry-form";
import { CtaBand } from "./components/cta-band";

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

type WorkWithMeClientProps = {
  spotify: WorkWithMeSpotify;
  recentPosts: RecentPostsData;
};

export function WorkWithMeClient({ spotify, recentPosts }: WorkWithMeClientProps) {
  const inquiryRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const scrollToForm = () => {
    inquiryRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <main className="relative w-full overflow-x-clip" style={{ background: "var(--bg-canvas)" }}>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 wwm-drift"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 50% -6%, rgba(224,61,42,0.22) 0%, transparent 68%),
            radial-gradient(ellipse 45% 40% at 6% 32%, rgba(224,61,42,0.10) 0%, transparent 60%),
            radial-gradient(ellipse 50% 45% at 96% 70%, rgba(212,196,168,0.10) 0%, transparent 62%)
          `,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          opacity: 0.03,
          backgroundImage: GRAIN_SVG,
          backgroundRepeat: "repeat",
          backgroundSize: "220px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{ boxShadow: "inset 0 0 220px 60px rgba(0,0,0,0.55)" }}
      />

      <div className="relative z-[1]">
        <Hero onPrimaryCta={scrollToForm} artist={spotify.artist} />

        <Marquee />

        <RevealSection threshold={0.08} distance={40}>
          <BioRow onCta={scrollToForm} artist={spotify.artist} />
        </RevealSection>

        <RevealSection threshold={0.08} distance={40}>
          <PlacementsGrid placements={spotify.placements} />
        </RevealSection>

        <RevealSection threshold={0.08} distance={40}>
          <ArtistLinks />
        </RevealSection>

        <RevealSection threshold={0.08} distance={40}>
          <RecentPosts data={recentPosts} />
        </RevealSection>

        <RevealSection threshold={0.08} distance={40}>
          <ServicesList />
        </RevealSection>

        <FeaturedTracks releases={spotify.releases} />

        <div ref={inquiryRef} id="work-with-me-inquiry" className="scroll-mt-24 section-y-standard">
          <RevealSection threshold={0.06} distance={40}>
            <InquiryForm />
          </RevealSection>
        </div>

        <CtaBand onCta={scrollToForm} />
      </div>
    </main>
  );
}
