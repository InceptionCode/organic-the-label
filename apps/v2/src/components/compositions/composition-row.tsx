import { useId } from 'react'
import { ChevronDown, PlaySquare } from 'lucide-react'
import { AudioPlayer } from '~/components/audio/audio-player'
import { TAG_OPTIONS } from '~/lib/composition-search'
import type { CompositionListItem } from '~/server/compositions/columns'
import { cn } from '~/ui/cn'
import { CompositionActions } from './composition-actions'
import { formatPostedAt } from './composition-card'
import { SocialEmbed } from './social-embed'

const PLATFORM_LABEL: Record<CompositionListItem['platform'], string> = {
  instagram: 'Instagram',
  youtube: 'YouTube Shorts',
}
const WATCH_LABEL: Record<CompositionListItem['platform'], string> = { instagram: 'Instagram', youtube: 'YouTube' }

const TAG_LABELS = new Map<string, string>(TAG_OPTIONS.map((o) => [o.value, o.label]))
const tagLabel = (tag: string) => TAG_LABELS.get(tag.toLowerCase()) ?? tag.charAt(0).toUpperCase() + tag.slice(1)

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]'

type CompositionRowProps = {
  composition: CompositionListItem
  /** The loop shown in the desktop video panel. */
  selected: boolean
  /** Desktop: the sticky panel shows the video, so "Watch" selects instead of opening inline. */
  desktop: boolean
  /** Mobile and tablet: this row's video is open inline (one at a time). */
  watching: boolean
  onSelect: () => void
  onWatch: () => void
}

export function CompositionRow({ composition, selected, desktop, watching, onSelect, onWatch }: CompositionRowProps) {
  const videoId = useId()
  const meta = [composition.bpm ? `${composition.bpm} BPM` : null, composition.musical_key].filter(Boolean).join(' · ')
  const playerSrc = composition.preview_url ?? composition.audio_file_url
  const tags = composition.tags.map(tagLabel)
  const watchExpanded = desktop ? selected : watching
  // The red bar marks the loop in the desktop panel, or the one open inline below lg.
  const marked = desktop ? selected : watching

  return (
    <article
      data-testid="composition-row"
      aria-current={selected && desktop ? 'true' : undefined}
      className="relative py-7 pl-5 md:pl-6"
    >
      <span
        aria-hidden
        className={cn(
          'absolute bottom-7 left-0 top-7 w-0.5 origin-top bg-[color:var(--accent-primary)] transition-transform duration-300 ease-[var(--ease-spring)]',
          marked ? 'scale-y-100' : 'scale-y-0',
        )}
      />

      <div className="flex items-center justify-between gap-4">
        <p className="text-label">
          {PLATFORM_LABEL[composition.platform]} · {formatPostedAt(composition.posted_at)}
        </p>
        <button
          type="button"
          onClick={onWatch}
          aria-expanded={watchExpanded}
          aria-controls={desktop ? 'composition-video-panel' : videoId}
          className={cn(
            '-my-3 inline-flex min-h-11 shrink-0 items-center gap-2 rounded-sm text-body-s font-medium transition-colors duration-150 hover:cursor-pointer active:opacity-70',
            watchExpanded ? 'text-[color:var(--text-primary)]' : 'text-secondary hover:text-[color:var(--text-primary)]',
            focusRing,
          )}
        >
          <PlaySquare className="size-4" aria-hidden />
          <span className="link-underline">
            {desktop && selected ? 'Watching' : 'Watch'}
            <span className="max-sm:hidden"> on {WATCH_LABEL[composition.platform]}</span>
            {/* Name from content: the visible words first, then the loop (WCAG 2.5.3 label in name). */}
            <span className="sr-only">: {composition.title}</span>
          </span>
          {!desktop && <ChevronDown aria-hidden className={cn('size-4 transition-transform duration-200', watching && 'rotate-180')} />}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <h2 className="text-h3 text-primary">{composition.title}</h2>
        {meta && <p className="text-body-s tabular-nums text-secondary">{meta}</p>}
      </div>
      {composition.description && <p className="mt-2 line-clamp-2 max-w-[60ch] text-body-s text-secondary">{composition.description}</p>}
      {tags.length > 0 && <p className="mt-2 text-label">{tags.join(' · ')}</p>}

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        {playerSrc && (
          <AudioPlayer
            src={playerSrc}
            title={composition.title}
            onStart={onSelect}
            source={{ surface: 'composition', title: composition.title, slug: composition.slug }}
            className="sm:flex-1"
          />
        )}
        <CompositionActions
          slug={composition.slug}
          title={composition.title}
          platform={composition.platform}
          embedUrl={composition.embed_url}
          primary={marked}
        />
      </div>

      {/* Mobile and tablet only: mounted when opened, so no iframe loads until asked. */}
      {!desktop && watching && (
        <div id={videoId} className="os-fade-in mt-6">
          <SocialEmbed platform={composition.platform} url={composition.embed_url} title={composition.title} />
        </div>
      )}
    </article>
  )
}
