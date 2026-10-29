import { instagramEmbedSrc } from '~/lib/work-with-me-embeds'
import type { RecentPostsData } from '~/server/social/work-with-me'

export type PostSlide = {
  key: string
  src: string
  alt: string
  title: string
  kind: 'youtube' | 'instagram'
  embedSrc: string
  href: string
  /** Instagram only: same-origin proxy path for inline playback; null links out. */
  videoUrl?: string | null
  isVideoPost?: boolean
}

/** Interleave YouTube and Instagram (YT, IG, YT, IG...) so the carousel alternates sources (v1). */
export function buildSlides(data: RecentPostsData): PostSlide[] {
  const yt: PostSlide[] = data.youtube.flatMap((v) =>
    v.thumbnailUrl
      ? [
          {
            key: `yt-${v.id}`,
            src: v.thumbnailUrl,
            alt: v.title,
            title: v.title,
            kind: 'youtube' as const,
            embedSrc: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.id)}?autoplay=1&rel=0`,
            href: v.url,
          },
        ]
      : [],
  )
  const ig: PostSlide[] = data.instagram.flatMap((p) => {
    const embedSrc = instagramEmbedSrc(p.url)
    if (!p.imageUrl || !embedSrc) return []
    const title = p.caption || 'Instagram post'
    return [{ key: `ig-${p.id}`, src: p.imageUrl, alt: title, title, kind: 'instagram' as const, embedSrc, href: p.url, videoUrl: p.videoUrl, isVideoPost: p.isVideoPost }]
  })
  const woven: PostSlide[] = []
  for (let i = 0; i < Math.max(yt.length, ig.length); i++) {
    if (yt[i]) woven.push(yt[i]!)
    if (ig[i]) woven.push(ig[i]!)
  }
  return woven
}

export const slideLabel = (slide: PostSlide, index: number, count: number) => `${slide.title}, ${index + 1} of ${count}`

export type CoverflowProps = { slides: PostSlide[]; onActivate: (slide: PostSlide) => void; label: string }
