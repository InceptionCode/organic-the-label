import { useId, type ReactNode } from 'react'
import { ChevronDown, PlaySquare } from 'lucide-react'
import { AudioPlayer } from '~/components/audio/audio-player'
import { TAG_OPTIONS } from '~/lib/composition-search'
import type { CompositionListItem } from '~/server/compositions/columns'
import { cn } from '~/ui/cn'
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

export function formatPostedAt(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

type CompositionCardProps = {
  composition: CompositionListItem
  /** h2 directly under a page h1; h3 inside a titled group (search, explore). */
  headingLevel?: 'h2' | 'h3'
  /** Actions (search passes the download actions). Defaults to a link to the loop on /compositions. */
  actions?: ReactNode
  /** This loop's video is open inline below the row (search; one at a time, owned by the parent). */
  watching?: boolean
  /** Shows the "Watch" toggle; the video mounts only while `watching`. Omit to hide the toggle (explore). */
  onWatch?: () => void
}

/**
 * Compact composition used outside /compositions (search, explore), in the same flat row language
 * as `CompositionRow`: meta, Bebas title, BPM and key, description, tags, then the compact player and
 * actions. No video panel here: with `onWatch`, "Watch" opens the embed inline under the row. The red
 * left bar marks the open row, matching /compositions on mobile.
 */
export function CompositionCard({ composition, headingLevel: Heading = 'h2', actions, watching = false, onWatch }: CompositionCardProps) {
  const videoId = useId()
  const meta = [composition.bpm ? `${composition.bpm} BPM` : null, composition.musical_key].filter(Boolean).join(' · ')
  const playerSrc = composition.preview_url ?? composition.audio_file_url
  const tags = composition.tags.map(tagLabel)

  return (
    <article data-testid="composition-card" className="relative h-full py-7 pl-5 md:pl-6">
      <span
        aria-hidden
        className={cn(
          'absolute bottom-7 left-0 top-7 w-0.5 origin-top bg-[color:var(--accent-primary)] transition-transform duration-300 ease-[var(--ease-spring)]',
          watching ? 'scale-y-100' : 'scale-y-0',
        )}
      />

      <div className="flex items-center justify-between gap-4">
        <p className="text-label">
          {PLATFORM_LABEL[composition.platform]} · {formatPostedAt(composition.posted_at)}
        </p>
        {onWatch && (
          <button
            type="button"
            onClick={onWatch}
            aria-expanded={watching}
            aria-controls={videoId}
            aria-label={`Watch ${composition.title} on ${WATCH_LABEL[composition.platform]}`}
            className={cn(
              '-my-3 inline-flex min-h-11 shrink-0 items-center gap-2 rounded-sm text-body-s font-medium transition-colors duration-150 hover:cursor-pointer active:opacity-70',
              watching ? 'text-[color:var(--text-primary)]' : 'text-secondary hover:text-[color:var(--text-primary)]',
              focusRing,
            )}
          >
            <PlaySquare className="size-4" aria-hidden />
            <span className="link-underline">
              Watch<span className="max-sm:hidden"> on {WATCH_LABEL[composition.platform]}</span>
            </span>
            <ChevronDown aria-hidden className={cn('size-4 transition-transform duration-200', watching && 'rotate-180')} />
          </button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <Heading className="text-h3 text-primary">{composition.title}</Heading>
        {meta && <p className="text-body-s tabular-nums text-secondary">{meta}</p>}
      </div>
      {composition.description && <p className="mt-2 line-clamp-2 max-w-[60ch] text-body-s text-secondary">{composition.description}</p>}
      {tags.length > 0 && <p className="mt-2 text-label">{tags.join(' · ')}</p>}

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        {playerSrc && <AudioPlayer src={playerSrc} title={composition.title} className="sm:flex-1" />}
        {actions ?? (
          <a
            href={`/compositions#${composition.slug}`}
            className={cn('inline-flex min-h-11 shrink-0 items-center rounded-sm text-body-s font-medium text-primary no-underline', focusRing)}
          >
            <span className="link-underline">Open loop and download</span>
            <span className="sr-only">: {composition.title}</span>
          </a>
        )}
      </div>

      {/* Mounted only when opened, so no iframe loads until asked. */}
      {onWatch && watching && (
        <div id={videoId} className="os-fade-in mt-6">
          <SocialEmbed platform={composition.platform} url={composition.embed_url} title={composition.title} />
        </div>
      )}
    </article>
  )
}
