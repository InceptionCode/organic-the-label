/**
 * Single source of content for the Work With Me page (`/work-with-me`).
 */

import { spotifyArtistIdFromUrl, youtubeHandleFromUrl } from "./embeds";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type ServiceIconKey = "mixing" | "collab" | "leasing" | "suite";

export type Service = {
  title: string;
  blurb: string;
  icon: ServiceIconKey;
};

export type Placement = {
  artist: string;
  track: string;
  role: string;
  /** Spotify track URL. Cover art is pulled from it; missing/non-Spotify ⇒ icon fallback. */
  href?: string;
};

export type ArtistPlatform = "spotify" | "appleMusic" | "youtube";

export type ArtistLink = {
  platform: ArtistPlatform;
  label: string;
  url: string;
};


// ─────────────────────────────────────────────────────────────
// Hero + bio copy
// ─────────────────────────────────────────────────────────────

export const HERO = {
  eyebrow: "Producer services & placements",
  titleLines: ["Crafting the", "future of sound"],
  subcopy:
    "Collaborate directly with JUICEMAN to elevate your sound — from custom production and beats to mixing and mastering for Hip-Hop, Trap, and R&B.",
  ctaLabel: "Start a project",
  imageUrl: "https://placehold.co/900x1100/171717/9A8E7E?text=JUICEMAN",
  imageAlt: "JUICEMAN in the studio",
};

export const BIO = {
  heading: "Who is JUICEMAN?",
  paragraphs: [
    "JUICEMAN makes atmospheric instrumentals where emotion, texture, and rhythm move as one — melodic trap, ambient soundscapes, soulful harmony, and vintage-inspired production. Rooted in Atlanta and built on an artist-first approach, he treats every beat as its own world: expressive melodies, spacious arrangements, detailed sound design, and drums that carry real weight and movement.",
    "The sound sits between modern hip-hop and immersive, film-like composition — pulling from analog warmth, R&B, and soul, and shaped by everyone from Pharrell, Kanye, and Prince to Wheezy, Future, and Travis Scott. Across instrumental projects, producer collaborations, and visual storytelling, it's a body of work centered on feeling and music that lasts beyond the moment.",
  ],
  platformNote:
    "Organic Sonics is the platform being built around that work — part catalog, part studio, part storefront. It's where artists and producers stream the instrumentals, book production and mix sessions, and pull from the same sounds and sessions that shape the releases.",
  ctaLabel: "Work with me",
};

// ─────────────────────────────────────────────────────────────
// Muso.ai credits embed
// ─────────────────────────────────────────────────────────────

export const MUSO_PROFILE_URL = "";

/** External link shown on the placeholder card and as the embed fallback. */
export const MUSO_FALLBACK_URL = "";

// ─────────────────────────────────────────────────────────────
// Artist link pills — Spotify / Apple Music / YouTube
// ─────────────────────────────────────────────────────────────

export const ARTIST_LINKS: ArtistLink[] = [
  { platform: "spotify", label: "Spotify — Artist Page", url: "https://open.spotify.com/artist/1rfSEaVxpWG8WXtL6Wj0SH?si=P6d4tYw-RRSx0GMjrtZV7g" },
  { platform: "appleMusic", label: "Apple Music — Artist Page", url: "https://music.apple.com/us/artist/juiceman/6788973192" },
  { platform: "youtube", label: "YouTube — Main Channel", url: "https://www.youtube.com/@juiceman-theprod" },
  { platform: "youtube", label: "YouTube — Shorts Channel", url: "https://www.youtube.com/@juiceman-theprod" },
];

// ─────────────────────────────────────────────────────────────
// Recent posts — auto-pulled
// ─────────────────────────────────────────────────────────────

export const YOUTUBE_HANDLE =
  youtubeHandleFromUrl(ARTIST_LINKS.find((link) => link.platform === "youtube")?.url ?? "") ?? "";

// ─────────────────────────────────────────────────────────────
// Major placements & credits
//   • Curated highlights below (6 total)
//   • The Muso.ai embed is the fuller, self-updating list shown beneath them
// ─────────────────────────────────────────────────────────────

export const PLACEMENTS: Placement[] = [
  {
    artist: "RRForeverSolid",
    track: "Like The Rest",
    role: "Producer, Mastering Engineer",
    href: "https://open.spotify.com/track/2dscDmPAiY0NoCZImNXXCR?si=8a706e7ec74e4dec"
  },
  {
    artist: "RRForeverSolid",
    track: "Something To See",
    role: "Producer, Mastering Engineer",
    href: "https://open.spotify.com/track/7sB9pnsYK9KiwFkVjwSLld?si=abcb47a5ceda4ffb"
  },
  {
    artist: "RRForeverSolid",
    track: "Double Up",
    role: "Producer, Mastering Engineer",
    href: "https://open.spotify.com/track/72RbpkRqYj5p5MWqDQSUfU?si=cee4058bb38245f2"
  },
  {
    artist: "RRForeverSolid",
    track: "Muddies",
    role: "Producer",
    href: "https://open.spotify.com/track/7sjmDwOaN9WBPj73uDxYlg?si=b4bf53dd5e0445fd"
  },
];

// ─────────────────────────────────────────────────────────────
// Services — the only pre-filled list
// ─────────────────────────────────────────────────────────────

export const SERVICES: Service[] = [
  {
    title: "Mixing & Mastering",
    blurb: "Industry-standard sonic quality — clean, loud, and translation-ready.",
    icon: "mixing",
  },
  {
    title: "Production Collabs",
    blurb: "Co-produce your next record from the first idea to the final bounce.",
    icon: "collab",
  },
  {
    title: "Beat Leasing",
    blurb: "License from an exclusive catalog of unreleased instrumentals.",
    icon: "leasing",
  },
  {
    title: "Production Suite",
    blurb: "Full-service package — production, arrangement, mix, and master under one roof.",
    icon: "suite",
  },
];

// ─────────────────────────────────────────────────────────────
// Proof of work — Spotify featured tracks embed
// ─────────────────────────────────────────────────────────────

export const SPOTIFY_EMBED_URL = "https://open.spotify.com/embed/artist/1rfSEaVxpWG8WXtL6Wj0SH?utm_source=generator&si=9fa2e27ecd514fc0"

export const SPOTIFY_ARTIST_ID =
  spotifyArtistIdFromUrl(ARTIST_LINKS.find((link) => link.platform === "spotify")?.url ?? "") ?? "";
