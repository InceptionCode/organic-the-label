"use client";

import { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import type { RecentPostsData } from "@/lib/work-with-me/recent-posts-data";
import { SectionHeading } from "./section-heading";
import { InstagramCard } from "./instagram-card";

type RecentPostsProps = {
  data: RecentPostsData;
};

function Scroller({ children, label }: { children: React.ReactNode; label: string }) {
  const ref = useRef<HTMLUListElement>(null);
  const by = (dir: 1 | -1) => {
    const node = ref.current;
    if (node) node.scrollBy({ left: dir * node.clientWidth * 0.8, behavior: "smooth" });
  };
  return (
    <div className="relative">
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="eyebrow" style={{ color: "var(--accent-secondary)" }}>
          {label}
        </p>
        <div className="hidden gap-2 sm:flex">
          {([-1, 1] as const).map((dir) => (
            <button
              key={dir}
              type="button"
              onClick={() => by(dir)}
              aria-label={dir === -1 ? `Previous ${label}` : `Next ${label}`}
              className="flex h-10 w-10 items-center justify-center rounded-full border transition-soft hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
              style={{ borderColor: "rgba(224,61,42,0.22)", background: "var(--surface-1)" }}
            >
              {dir === -1 ? (
                <ChevronLeft className="h-5 w-5 text-secondary" aria-hidden />
              ) : (
                <ChevronRight className="h-5 w-5 text-secondary" aria-hidden />
              )}
            </button>
          ))}
        </div>
      </div>
      <ul ref={ref} className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2">
        {children}
      </ul>
    </div>
  );
}

export function RecentPosts({ data }: RecentPostsProps) {
  const { youtube, instagram } = data;
  if (youtube.length === 0 && instagram.length === 0) return null;

  return (
    <section className="content-container section-y-standard" aria-labelledby="wwm-posts-title">
      <SectionHeading
        id="wwm-posts-title"
        eyebrow="Lately"
        title="Recent posts"
        description="New sessions, breakdowns, and drops — pulled straight from YouTube and Instagram."
      />

      <div className="mt-8 flex flex-col gap-10">
        {youtube.length > 0 && (
          <Scroller label="Latest videos">
            {youtube.map((video) => (
              <li key={video.id} className="w-[300px] shrink-0 snap-start sm:w-[360px]">
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wwm-card group block overflow-hidden"
                >
                  <span className="relative block aspect-video overflow-hidden">
                    {video.thumbnailUrl ? (
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title}
                        fill
                        sizes="360px"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                      />
                    ) : (
                      <span className="block h-full w-full bg-surface-2" />
                    )}
                    <span
                      aria-hidden
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent 55%)" }}
                    >
                      <span
                        className="flex h-12 w-12 items-center justify-center rounded-full transition-transform group-hover:scale-110"
                        style={{ background: "var(--accent-primary)" }}
                      >
                        <Play className="h-5 w-5" style={{ color: "#fff", marginLeft: 2 }} aria-hidden />
                      </span>
                    </span>
                  </span>
                  <span className="block px-3 py-3">
                    <span className="line-clamp-2 text-body-s text-primary">{video.title}</span>
                  </span>
                </a>
              </li>
            ))}
          </Scroller>
        )}

        {instagram.length > 0 && (
          <Scroller label="From the feed">
            {instagram.map((post) => (
              <li key={post.id} className="w-[300px] shrink-0 snap-start sm:w-[340px]">
                <InstagramCard url={post.url} caption={post.caption} />
              </li>
            ))}
          </Scroller>
        )}
      </div>
    </section>
  );
}
