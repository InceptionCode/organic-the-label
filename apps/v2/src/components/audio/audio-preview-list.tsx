import { useState, type UIEvent } from 'react'
import type { AudioPreview } from '~/server/shopify/types'
import { cn } from '~/ui/cn'
import { AudioPlayer } from './audio-player'

/** Rows shown before the list scrolls. */
const VISIBLE_ROWS = 5

const LIST_MAX_HEIGHT = `calc(${VISIBLE_ROWS} * (3.25rem + 2px) + ${VISIBLE_ROWS - 1} * 0.5rem)`

/** Soft edges where rows continue: top once scrolled, bottom until the end. */
function fadeMask(fadeTop: boolean, fadeBottom: boolean): string | undefined {
  if (!fadeTop && !fadeBottom) return undefined
  const top = fadeTop ? 'transparent, #000 1.5rem' : '#000'
  const bottom = fadeBottom ? '#000 calc(100% - 3rem), transparent' : '#000'
  return `linear-gradient(to bottom, ${top}, ${bottom})`
}

type AudioPreviewListProps = {
  previews: AudioPreview[]
  title?: string
  /** Fired once per preview row, on its first play (tracking hooks in here in phase 06). */
  onPreviewPlay?: (previewTitle: string) => void
}

export function AudioPreviewList({ previews, title, onPreviewPlay }: AudioPreviewListProps) {
  const [edges, setEdges] = useState({ atStart: true, atEnd: false })
  if (previews.length === 0) return null
  const scrolls = previews.length > VISIBLE_ROWS

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget
    setEdges({ atStart: el.scrollTop <= 4, atEnd: el.scrollTop + el.clientHeight >= el.scrollHeight - 4 })
  }

  const mask = scrolls ? fadeMask(!edges.atStart, !edges.atEnd) : undefined

  return (
    <div className="w-full space-y-3">
      {title && (
        <p className="eyebrow text-[color:var(--accent-secondary)] tracking-[0.12em]">{title} previews</p>
      )}
      {/* The focus ring sits on this wrapper: the list's fade mask would clip it. */}
      <div
        className={cn(
          scrolls &&
          'rounded-lg has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[color:var(--accent-primary)] has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-[color:var(--bg-canvas)]',
        )}
      >
        <div
          className={cn(
            'flex flex-col gap-2',
            scrolls && 'overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin] focus-visible:outline-none',
          )}
          style={scrolls ? { maxHeight: LIST_MAX_HEIGHT, maskImage: mask, WebkitMaskImage: mask } : undefined}
          onScroll={scrolls ? handleScroll : undefined}
          tabIndex={scrolls ? 0 : undefined}
          role={scrolls ? 'region' : undefined}
          aria-label={scrolls ? `${previews.length} audio previews, scrollable` : undefined}
        >
          {previews.map((preview, index) => (
            <AudioPlayer
              key={`${preview.preview_title}-${index}`}
              src={preview.preview_url}
              title={preview.preview_title}
              onPlay={onPreviewPlay ? () => onPreviewPlay(preview.preview_title) : undefined}
              className="shrink-0"
            />
          ))}
        </div>
      </div>
      {scrolls && <p className="text-caption text-muted">{previews.length} previews. Scroll the list to hear the rest.</p>}
    </div>
  )
}
