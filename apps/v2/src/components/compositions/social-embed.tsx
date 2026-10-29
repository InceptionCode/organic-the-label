import { useEffect, useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { instagramEmbedSrc, safeExternalHref, youtubeIdFromUrl } from '~/lib/embed-url'
import type { CompositionListItem } from '~/server/compositions/columns'

type SocialEmbedProps = {
  platform: CompositionListItem['platform']
  url: string
  title: string
  /**
   * 'panel': the sticky desktop panel; height capped to the viewport below the navbar and loops bar.
   * 'inline' (default): full column width up to 400px, under a row on mobile and tablet.
   */
  variant?: 'panel' | 'inline'
}

// Instagram's /embed/ page lays out a reel at 400x720 (header, 9:16 video, caption); keep that ratio
// so it scales instead of overflowing a fixed 720px box. YouTube Shorts are 9:16.
const RATIO: Record<CompositionListItem['platform'], string> = { instagram: '400 / 720', youtube: '9 / 16' }

/**
 * Port of v1 social-embed.tsx. The iframe mounts only within 400px of the viewport (pulse
 * placeholder before that). Instagram renders its `/embed/` page directly instead of embed.js, so
 * no third-party script touches the DOM and remounts after filter changes stay deterministic.
 */
export function SocialEmbed({ platform, url, title, variant = 'inline' }: SocialEmbedProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || visible) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        setVisible(true)
        observer.disconnect()
      },
      { rootMargin: '400px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [visible])

  const youtubeId = platform === 'youtube' ? youtubeIdFromUrl(url) : null
  const instagramSrc = platform === 'instagram' ? instagramEmbedSrc(url) : null

  return (
    <div
      ref={ref}
      className={
        variant === 'panel'
          ? 'h-[min(720px,calc(100svh-15.5rem))] max-w-full overflow-hidden bg-surface-1'
          : 'mx-auto w-full max-w-[400px] overflow-hidden bg-surface-1'
      }
      style={{ aspectRatio: RATIO[platform] }}
    >
      <div className="relative h-full w-full">
        {!visible ? (
          <div className="absolute inset-0 animate-pulse bg-surface-2 motion-reduce:animate-none" aria-hidden />
        ) : youtubeId ? (
          <iframe
            className="absolute inset-0 h-full w-full border-0"
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
            title={title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : instagramSrc ? (
          <iframe
            className="absolute inset-0 h-full w-full border-0 bg-black"
            src={instagramSrc}
            title={title}
            loading="lazy"
            scrolling="no"
            allow="clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <EmbedFallback url={url} label={platform === 'youtube' ? 'Watch on YouTube' : 'View on Instagram'} />
        )}
      </div>
    </div>
  )
}

function EmbedFallback({ url, label }: { url: string; label: string }) {
  const href = safeExternalHref(url)
  if (!href) {
    return (
      <div className="absolute inset-0 flex items-center justify-center border border-subtle bg-surface-1 text-body-s text-muted">
        Preview unavailable
      </div>
    )
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="absolute inset-0 flex flex-col items-center justify-center gap-2 border border-subtle bg-surface-1 text-body-s text-secondary no-underline transition-colors duration-150 hover:text-[color:var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-primary)] active:opacity-80"
    >
      <ExternalLink className="size-5" aria-hidden />
      {label}
    </a>
  )
}
