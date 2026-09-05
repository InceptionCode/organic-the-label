'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { CompositionListItem } from '@/lib/schemas';

declare global {
  interface Window {
    instgrm?: { embeds?: { process: () => void } };
  }
}

type Props = {
  platform: CompositionListItem['platform'];
  url: string;
  title: string;
};

const INSTAGRAM_EMBED_SRC = 'https://www.instagram.com/embed.js';
let instagramScriptPromise: Promise<void> | null = null;

function loadInstagramEmbedScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.instgrm) return Promise.resolve();
  if (instagramScriptPromise) return instagramScriptPromise;

  instagramScriptPromise = new Promise<void>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${INSTAGRAM_EMBED_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener('load', () => resolve());
      if (window.instgrm) resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = INSTAGRAM_EMBED_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.body.appendChild(script);
  });

  return instagramScriptPromise;
}

function youtubeIdFromUrl(raw: string): string | null {
  const value = raw.trim();
  if (/^[\w-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.hostname === 'youtu.be') return url.pathname.slice(1) || null;
    if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2] || null;
    if (url.pathname.startsWith('/embed/')) return url.pathname.split('/')[2] || null;
    return url.searchParams.get('v');
  } catch {
    return null;
  }
}

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

  return (
    <div ref={containerRef} className="mx-auto w-full max-w-[340px] overflow-hidden rounded-md">
      <div
        className="relative w-full"
        style={
          platform === 'youtube'
            ? { aspectRatio: '9 / 16' }
            : { minHeight: visible ? undefined : 460 }
        }
      >
        {!visible ? (
          <div className="absolute inset-0 animate-pulse rounded-md bg-surface-2" aria-hidden />
        ) : platform === 'youtube' ? (
          <YouTubeEmbed url={url} title={title} />
        ) : (
          <InstagramEmbed url={url} />
        )}
      </div>
    </div>
  );
}

function YouTubeEmbed({ url, title }: { url: string; title: string }) {
  const id = youtubeIdFromUrl(url);

  if (!id) return <EmbedFallback url={url} label="Watch on YouTube" />;

  return (
    <iframe
      className="absolute inset-0 h-full w-full rounded-md border-0"
      src={`https://www.youtube-nocookie.com/embed/${id}`}
      title={title}
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}

function InstagramEmbed({ url }: { url: string }) {
  useEffect(() => {
    let cancelled = false;
    loadInstagramEmbedScript().then(() => {
      if (!cancelled) window.instgrm?.embeds?.process();
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <blockquote
      className="instagram-media"
      data-instgrm-permalink={url}
      data-instgrm-version="14"
      style={{ background: '#000', border: 0, margin: 0, padding: 0, width: '100%' }}
    >
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-body-s text-muted">
        View this post on Instagram
      </a>
    </blockquote>
  );
}

function EmbedFallback({ url, label }: { url: string; label: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-md border border-subtle bg-surface-2 text-body-s text-secondary transition-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
    >
      <ExternalLink className="h-5 w-5" aria-hidden />
      {label}
    </a>
  );
}
