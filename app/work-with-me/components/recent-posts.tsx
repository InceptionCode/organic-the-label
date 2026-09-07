"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SocialEmbed } from "@/app/compositions/components/social-embed";
import { youtubeIdFromUrl, instagramEmbedSrc } from "@/lib/composition/embed-url";
import { RECENT_POSTS } from "@/lib/work-with-me/content";
import { SectionHeading } from "./section-heading";

type ResolvedPost = {
  url: string;
  caption?: string;
  platform: "youtube" | "instagram";
};

function resolvePlatform(url: string): ResolvedPost["platform"] | null {
  if (youtubeIdFromUrl(url)) return "youtube";
  if (instagramEmbedSrc(url)) return "instagram";
  return null;
}

export function RecentPosts() {
  const scrollerRef = useRef<HTMLUListElement>(null);

  const posts: ResolvedPost[] = RECENT_POSTS.map((post) => {
    const platform = resolvePlatform(post.url);
    return platform ? { ...post, platform } : null;
  }).filter((post): post is ResolvedPost => post !== null);

  if (posts.length === 0) return null;

  const scrollBy = (direction: 1 | -1) => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({ left: direction * (node.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <section className="content-container section-y-standard" aria-labelledby="wwm-posts-title">
      <div className="flex items-end justify-between gap-4">
        <SectionHeading
          id="wwm-posts-title"
          eyebrow="Lately"
          title="Recent posts"
          description="New sessions, breakdowns, and drops from Instagram and YouTube."
        />
        <div className="hidden shrink-0 gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Previous posts"
            className="flex h-11 w-11 items-center justify-center rounded-full border transition-soft hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
            style={{ borderColor: "var(--border-default)", background: "var(--surface-1)" }}
          >
            <ChevronLeft className="h-5 w-5 text-secondary" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Next posts"
            className="flex h-11 w-11 items-center justify-center rounded-full border transition-soft hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
            style={{ borderColor: "var(--border-default)", background: "var(--surface-1)" }}
          >
            <ChevronRight className="h-5 w-5 text-secondary" aria-hidden />
          </button>
        </div>
      </div>

      <ul
        ref={scrollerRef}
        className="no-scrollbar mt-7 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2"
      >
        {posts.map((post, i) => (
          <li
            key={post.url}
            className="w-[300px] shrink-0 snap-start sm:w-[340px]"
          >
            <div className="card-base card-padding-sm">
              <SocialEmbed
                platform={post.platform}
                url={post.url}
                title={post.caption ?? `JUICEMAN post ${i + 1}`}
              />
              {post.caption && (
                <p className="text-body-s text-secondary mt-3 px-1" style={{ lineHeight: 1.5 }}>
                  {post.caption}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
