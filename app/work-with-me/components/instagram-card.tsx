"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { instagramEmbedSrc } from "@/lib/composition/embed-url";

/**
 * Compact Instagram embed for the recent-posts carousel. Same no-third-party-JS
 * iframe approach as `SocialEmbed`, but with a carousel-friendly fixed height
 * instead of the tall 720px used on the compositions grid.
 */
export function InstagramCard({ url, caption }: { url: string; caption?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const src = instagramEmbedSrc(url);
  const [visible, setVisible] = useState(
    () => typeof window !== "undefined" && typeof window.IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const node = ref.current;
    if (!node || visible || typeof window.IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
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
    <div ref={ref} className="wwm-card overflow-hidden">
      <div className="relative w-full" style={{ height: "480px" }}>
        {!visible ? (
          <div className="absolute inset-0 animate-pulse bg-surface-2" aria-hidden />
        ) : src ? (
          <iframe
            className="absolute inset-0 h-full w-full border-0 bg-black"
            src={src}
            title={caption ?? "Instagram post"}
            loading="lazy"
            scrolling="no"
            allow="clipboard-write; encrypted-media; picture-in-picture; web-share"
          />
        ) : (
          <a
            href={/^https?:\/\//i.test(url) ? url : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface-2 text-body-s text-secondary transition-soft hover:text-primary"
          >
            <ExternalLink className="h-5 w-5" aria-hidden />
            View on Instagram
          </a>
        )}
      </div>
      {caption && (
        <p className="line-clamp-2 px-3 py-3 text-body-s text-secondary" style={{ lineHeight: 1.5 }}>
          {caption}
        </p>
      )}
    </div>
  );
}
