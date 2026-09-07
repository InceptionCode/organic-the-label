"use client";

import { useEffect, useRef, useState } from "react";
import { Music } from "lucide-react";
import { spotifyEmbedSrc } from "@/lib/work-with-me/embeds";
import { SPOTIFY_EMBED_URL } from "@/lib/work-with-me/content";
import { SectionHeading } from "./section-heading";

export function FeaturedTracks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const src = spotifyEmbedSrc(SPOTIFY_EMBED_URL);

  const [visible, setVisible] = useState(
    () => typeof window !== "undefined" && typeof window.IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const node = containerRef.current;
    if (!node || visible || typeof window.IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <section className="content-container section-y-standard" aria-labelledby="wwm-tracks-title">
      <SectionHeading
        id="wwm-tracks-title"
        eyebrow="Proof of work"
        title="Featured tracks"
      />

      <div ref={containerRef} className="mt-7">
        {!src ? (
          <div
            className="card-base card-padding-lg flex flex-col items-center gap-3 text-center"
            style={{ minHeight: "200px", justifyContent: "center" }}
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full"
              style={{ background: "var(--accent-primary-soft)", color: "var(--accent-primary)" }}
            >
              <Music className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-h5 text-primary">Playlist coming soon</p>
            <p className="text-body-s text-secondary" style={{ maxWidth: "40ch" }}>
              A selection of recent productions will stream here.
            </p>
          </div>
        ) : visible ? (
          <iframe
            src={src}
            title="JUICEMAN — featured tracks on Spotify"
            loading="lazy"
            className="w-full border-0"
            style={{ height: "352px", borderRadius: "var(--radius-lg)" }}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          />
        ) : (
          <div
            className="w-full animate-pulse bg-surface-2"
            style={{ height: "352px", borderRadius: "var(--radius-lg)" }}
            aria-hidden
          />
        )}
      </div>
    </section>
  );
}
