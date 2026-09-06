'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { CompositionListItem } from '@/lib/schemas';
import { instagramEmbedSrc, youtubeIdFromUrl } from '@/lib/composition/embed-url';

type Props = {
  platform: CompositionListItem['platform'];
  url: string;
  title: string;
};

/**
 * Instagram's embed.js (`instgrm.embeds.process()`) only reliably converts
 * blockquotes present when the script first initializes; it is flaky for embeds
 * mounted later by a client-side route change (filter update) and won't re-embed
 * a permalink it has already handled. So instead of that script we render the
 * post's `/embed/` page directly in an iframe — same approach as YouTube:
 * deterministic, no third-party script touching our DOM, survives any remount.
 */
export function SocialEmbed({ platform, url, title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(
    () => typeof window !== 'undefined' && typeof window.IntersectionObserver === 'undefined',
  );

  useEffect(() => {
    const node = containerRef.current;
    if (!node || visible || typeof window.IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  const youtubeId = platform === 'youtube' ? youtubeIdFromUrl(url) : null;
  const instagramSrc = platform === 'instagram' ? instagramEmbedSrc(url) : null;

  const aspectClass =
    platform === 'youtube' ? 'relative aspect-[9/16] w-full' : 'relative w-full';
  const frameStyle = platform === 'youtube' ? undefined : { height: 720 };

  return (
    <div ref={containerRef} className="mx-auto w-full max-w-[400px] overflow-hidden rounded-md">
      <div className={aspectClass} style={frameStyle}>
        {!visible ? (
          <div className="absolute inset-0 animate-pulse rounded-md bg-surface-2" aria-hidden />
        ) : youtubeId ? (
          <iframe
            className="absolute inset-0 h-full w-full rounded-md border-0"
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
            title={title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : instagramSrc ? (
          <iframe
            className="absolute inset-0 h-full w-full rounded-md border-0 bg-black"
            src={instagramSrc}
            title={title}
            loading="lazy"
            scrolling="no"
            allow="clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <EmbedFallback
            url={url}
            label={platform === 'youtube' ? 'Watch on YouTube' : 'View on Instagram'}
          />
        )}
      </div>
    </div>
  );
}

function EmbedFallback({ url, label }: { url: string; label: string }) {
  const safeHref = /^https?:\/\//i.test(url.trim()) ? url : undefined;

  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-md border border-subtle bg-surface-2 text-body-s text-secondary transition-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
    >
      <ExternalLink className="h-5 w-5" aria-hidden />
      {label}
    </a>
  );
}
