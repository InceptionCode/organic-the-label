"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, ExternalLink, Play } from "lucide-react";
import type { RecentPostsData } from "@/lib/work-with-me/recent-posts-data";
import { instagramEmbedSrc } from "@/lib/composition/embed-url";
import { SectionHeading } from "./section-heading";
import { CoverflowCarousel, type CoverflowSlide } from "./coverflow-carousel";

type RecentPostsProps = {
  data: RecentPostsData;
};

type PlayerMeta = {
  kind: "youtube" | "instagram";
  embedSrc: string;
  href: string;
  /** IG only — same-origin proxy path for inline playback; null when it links out. */
  videoUrl?: string | null;
  /** IG only — poster frame for the <video> / link-out card. */
  poster?: string;
  /** IG only — the post is a video/Reel (drives the play glyph on the link-out card). */
  isVideoPost?: boolean;
};

/** Interleave YouTube + Instagram so the coverflow alternates sources. */
function buildSlides(data: RecentPostsData): CoverflowSlide[] {
  const yt: CoverflowSlide[] = data.youtube
    .filter((v) => v.thumbnailUrl)
    .map((v) => ({
      src: v.thumbnailUrl as string,
      alt: v.title,
      title: v.title,
      meta: {
        kind: "youtube",
        embedSrc: `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`,
        href: v.url,
      } satisfies PlayerMeta,
    }));

  const ig: CoverflowSlide[] = data.instagram
    .filter((p) => p.imageUrl && instagramEmbedSrc(p.url))
    .map((p) => ({
      src: p.imageUrl as string,
      alt: p.caption || "Instagram post",
      title: p.caption || "Instagram post",
      meta: {
        kind: "instagram",
        embedSrc: instagramEmbedSrc(p.url) as string,
        href: p.url,
        videoUrl: p.videoUrl,
        poster: p.imageUrl ?? undefined,
        isVideoPost: p.isVideoPost,
      } satisfies PlayerMeta,
    }));

  const woven: CoverflowSlide[] = [];
  for (let i = 0; i < Math.max(yt.length, ig.length); i++) {
    if (yt[i]) woven.push(yt[i]);
    if (ig[i]) woven.push(ig[i]);
  }
  return woven;
}

export function RecentPosts({ data }: RecentPostsProps) {
  const slides = useMemo(() => buildSlides(data), [data]);
  const [active, setActive] = useState<{ slide: CoverflowSlide; meta: PlayerMeta } | null>(null);
  const [videoError, setVideoError] = useState(false);

  const onActivate = useCallback((slide: CoverflowSlide) => {
    const meta = slide.meta as PlayerMeta | undefined;
    if (meta?.embedSrc) {
      setVideoError(false);
      setActive({ slide, meta });
    }
  }, []);

  if (slides.length === 0) return null;

  const isYouTube = active?.meta.kind === "youtube";

  return (
    <section className="content-container section-y-standard" aria-labelledby="wwm-posts-title">
      <SectionHeading
        id="wwm-posts-title"
        eyebrow="Lately"
        title="Recent posts"
        description="New sessions, breakdowns, and drops — pulled straight from YouTube and Instagram. Tap the center card to watch."
      />

      <div className="mt-6">
        <CoverflowCarousel slides={slides} onActivate={onActivate} label="Recent posts from YouTube and Instagram" />
      </div>

      <DialogPrimitive.Root open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className={[
              "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              isYouTube ? "w-[min(920px,92vw)]" : "w-[min(400px,92vw)]",
            ].join(" ")}
          >
            <div
              className="relative overflow-hidden rounded-[var(--radius-xl)]"
              style={{
                background: "#0B0B0B",
                border: "1px solid rgba(224,61,42,0.3)",
                boxShadow: "0 40px 120px -20px rgba(0,0,0,0.8), var(--shadow-glow)",
              }}
            >
              <DialogPrimitive.Title className="sr-only">
                {active?.slide.title ?? "Media player"}
              </DialogPrimitive.Title>

              {active &&
                (isYouTube ? (
                  <div className="aspect-video w-full">
                    <iframe
                      key={active.meta.embedSrc}
                      src={active.meta.embedSrc}
                      title={active.slide.title ?? "YouTube video"}
                      className="h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="relative h-[72vh] max-h-[760px] w-full bg-black">
                    {active.meta.videoUrl && !videoError ? (
                      <video
                        key={active.meta.videoUrl}
                        src={active.meta.videoUrl}
                        poster={active.meta.poster}
                        className="h-full w-full object-contain"
                        controls
                        autoPlay
                        loop
                        playsInline
                        preload="auto"
                        onError={() => setVideoError(true)}
                      />
                    ) : (
                      <a
                        key={active.meta.href}
                        href={active.meta.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group absolute inset-0 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-primary)]"
                      >
                        {active.meta.poster && (
                          <Image
                            src={active.meta.poster}
                            alt=""
                            fill
                            sizes="(min-width: 768px) 400px, 92vw"
                            className="object-cover"
                          />
                        )}
                        <span
                          aria-hidden
                          className="absolute inset-0"
                          style={{
                            background:
                              "linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.55))",
                          }}
                        />
                        <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                          <span
                            className="flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-200 ease-out group-hover:scale-105 group-focus-visible:scale-105 group-active:scale-95 motion-reduce:transition-none"
                            style={{
                              background: "var(--accent-primary)",
                              boxShadow: "var(--shadow-glow)",
                            }}
                          >
                            {active.meta.isVideoPost ? (
                              <Play className="h-7 w-7" style={{ color: "#fff", marginLeft: 3 }} aria-hidden />
                            ) : (
                              <ExternalLink className="h-6 w-6" style={{ color: "#fff" }} aria-hidden />
                            )}
                          </span>
                          <span
                            className="text-body-s font-medium text-white"
                            style={{ textShadow: "0 1px 14px rgba(0,0,0,0.65)" }}
                          >
                            {active.meta.isVideoPost
                              ? "Watch this Reel on Instagram"
                              : "View this post on Instagram"}
                          </span>
                        </span>
                      </a>
                    )}
                  </div>
                ))}

              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <a
                  href={active?.meta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-caption text-secondary transition-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  {isYouTube ? "Open on YouTube" : "Open on Instagram"}
                </a>
                <DialogPrimitive.Close
                  aria-label="Close"
                  className="flex h-9 w-9 items-center justify-center rounded-full border transition-soft hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
                  style={{ borderColor: "rgba(224,61,42,0.28)", background: "var(--surface-1)" }}
                >
                  <X className="h-4 w-4 text-secondary" aria-hidden />
                </DialogPrimitive.Close>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </section>
  );
}
