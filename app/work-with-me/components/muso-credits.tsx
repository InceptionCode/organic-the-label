"use client";

import Image from "next/image";
import { ExternalLink, BadgeCheck } from "lucide-react";
import { MUSO_PROFILE_URL, MUSO_SCREENSHOT_URL } from "@/lib/work-with-me/content";

const externalHref = (raw: string) => (/^https?:\/\//i.test(raw.trim()) ? raw.trim() : undefined);

export function MusoCredits() {
  const profileHref = externalHref(MUSO_PROFILE_URL);

  return (
    <div className="wwm-card overflow-hidden" style={{ maxWidth: "640px", marginInline: "auto" }}>
      <a
        href={profileHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open full verified credits on Muso.ai"
        className="group relative block focus-visible:outline-none"
        style={{ aspectRatio: "915 / 950" }}
      >
        <Image
          src={MUSO_SCREENSHOT_URL}
          alt="JUICEMAN's verified production credits, as listed on Muso.ai"
          fill
          sizes="(min-width: 640px) 640px, 100vw"
          quality={90}
          className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, rgba(20,8,7,0.75) 0%, rgba(20,8,7,0.15) 40%, transparent 65%)",
            mixBlendMode: "multiply",
          }}
        />
        <span
          aria-hidden
          className="absolute inset-0 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 group-focus-visible:opacity-100"
          style={{ boxShadow: "inset 0 0 0 2px var(--accent-primary)" }}
        />
        <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4">
          <span className="inline-flex items-center gap-1.5 text-caption uppercase" style={{ color: "#F8F7F2", letterSpacing: "0.08em" }}>
            <BadgeCheck className="h-4 w-4" aria-hidden />
            Verified on Muso.ai
          </span>
          <ExternalLink className="h-4 w-4 shrink-0" style={{ color: "#F8F7F2" }} aria-hidden />
        </span>
      </a>

      <div className="card-padding-lg flex flex-col gap-1.5">
        <p className="text-h5 text-primary">Full production discography</p>
        <p className="text-body-s text-secondary" style={{ maxWidth: "52ch" }}>
          Every mixing, mastering, and production credit is verified on Muso.ai
        </p>
        {profileHref && (
          <a
            href={profileHref}
            target="_blank"
            rel="noopener noreferrer"
            className="link mt-2 inline-flex w-fit items-center gap-1.5 text-body-s focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)] active:opacity-70"
          >
            View credits on Muso.ai
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        )}
      </div>
    </div>
  );
}
