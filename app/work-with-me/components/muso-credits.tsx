"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, BadgeCheck } from "lucide-react";
import { musoEmbedSrc } from "@/lib/work-with-me/embeds";
import { MUSO_PROFILE_URL, MUSO_FALLBACK_URL } from "@/lib/work-with-me/content";

const externalHref = (raw: string) => (/^https?:\/\//i.test(raw.trim()) ? raw.trim() : undefined);

export function MusoCredits() {
  const containerRef = useRef<HTMLDivElement>(null);
  const src = musoEmbedSrc(MUSO_PROFILE_URL);
  const fallbackHref = externalHref(MUSO_FALLBACK_URL) ?? externalHref(MUSO_PROFILE_URL);

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

  if (!src) {
    return (
      <div
        className="card-base card-padding-lg flex flex-col gap-4"
        style={{ minHeight: "220px", justifyContent: "center" }}
      >
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ background: "var(--accent-primary-soft)", color: "var(--accent-primary)" }}
        >
          <BadgeCheck className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-h5 text-primary">Verified credits, landing soon</p>
          <p className="text-body-s text-secondary mt-1" style={{ maxWidth: "44ch" }}>
            The full production discography is being verified on Muso.ai and will
            appear here shortly.
          </p>
        </div>
        {fallbackHref && (
          <a
            href={fallbackHref}
            target="_blank"
            rel="noopener noreferrer"
            className="link inline-flex items-center gap-1.5 text-body-s"
          >
            View credits on Muso.ai
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="card-base overflow-hidden" style={{ minHeight: "220px" }}>
      {visible ? (
        <iframe
          src={src}
          title="JUICEMAN — verified credits on Muso.ai"
          loading="lazy"
          className="w-full border-0"
          style={{ height: "460px" }}
          allow="clipboard-write"
        />
      ) : (
        <div className="h-[460px] w-full animate-pulse bg-surface-2" aria-hidden />
      )}
    </div>
  );
}
