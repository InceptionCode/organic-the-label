import { useRef, useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { ExternalLink, Play } from 'lucide-react'
import { workWithMeQueries } from '~/queries/work-with-me'
import { CloseIcon, closeButtonClasses, useNativeDialog } from '~/ui/dialog'
import { LazyVisual } from '~/ui/lazy-visual'
import { cn } from '~/ui/cn'
import { CoverflowPoster } from './coverflow-poster'
import { buildSlides, type CoverflowProps, type PostSlide } from './post-slides'
import { SectionHeading } from './section-heading'

const LABEL = 'Recent posts from YouTube and Instagram'

/** Streams in after the shell (the loader prefetches without awaiting). Hidden with no slides. */
export function RecentPosts() {
  const { data } = useSuspenseQuery(workWithMeQueries.recentPosts())
  const slides = buildSlides(data)
  const [active, setActive] = useState<PostSlide | null>(null)
  if (slides.length === 0) return null

  const carousel: CoverflowProps = { slides, onActivate: setActive, label: LABEL }
  return (
    <section aria-labelledby="wwm-posts-title" className="content-container section-y-standard">
      <SectionHeading
        id="wwm-posts-title"
        eyebrow="Lately"
        title="Recent posts"
        description="New sessions, breakdowns, and drops pulled straight from YouTube and Instagram. Tap the center card to watch."
      />
      <LazyVisual className="mt-6" load={() => import('./coverflow-carousel')} poster={<CoverflowPoster {...carousel} />} props={carousel} />
      <PostPlayer slide={active} onClose={() => setActive(null)} />
    </section>
  )
}

/** Native <dialog> player: focus trapped, Escape closes, playback stops (content unmounts). */
function PostPlayer({ slide, onClose }: { slide: PostSlide | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const { onBackdropClick } = useNativeDialog(ref, slide !== null, onClose)
  const youtube = slide?.kind === 'youtube'

  return (
    <dialog
      ref={ref}
      aria-labelledby="wwm-player-title"
      onClick={onBackdropClick}
      className={cn(
        'os-dialog m-auto max-h-[calc(100dvh-2rem)] overflow-visible bg-transparent p-0 backdrop:backdrop-blur-sm',
        youtube ? 'w-[min(920px,92vw)]' : 'w-[min(400px,92vw)]',
      )}
    >
      <div
        className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[rgba(224,61,42,0.3)] bg-[#0B0B0B]"
        style={{ boxShadow: '0 40px 120px -20px rgba(0,0,0,0.8), var(--shadow-glow)' }}
      >
        <h2 id="wwm-player-title" className="sr-only">
          {slide?.title ?? 'Media player'}
        </h2>
        {slide ? youtube ? <YouTubeFrame slide={slide} /> : <InstagramPlayer key={slide.key} slide={slide} /> : null}
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          {/* Only with a slide: an <a> without href (closed player in the SSR HTML) fails "links are crawlable". */}
          {slide ? (
            <a
              href={slide.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md text-caption text-secondary transition-colors duration-150 hover:text-[color:var(--text-primary)] active:opacity-70 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
              {youtube ? 'Open on YouTube' : 'Open on Instagram'}
            </a>
          ) : (
            <span />
          )}
          <button type="button" aria-label="Close" onClick={() => ref.current?.close()} className={closeButtonClasses}>
            <CloseIcon className="size-4" />
          </button>
        </div>
      </div>
    </dialog>
  )
}

function YouTubeFrame({ slide }: { slide: PostSlide }) {
  return (
    <div className="aspect-video w-full">
      <iframe
        src={slide.embedSrc}
        title={slide.title}
        className="size-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  )
}

function InstagramPlayer({ slide }: { slide: PostSlide }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="relative h-[72vh] max-h-[760px] w-full bg-black">
      {slide.videoUrl && !failed ? (
        <video
          src={slide.videoUrl}
          poster={slide.src}
          className="size-full object-contain"
          controls
          autoPlay
          loop
          playsInline
          preload="auto"
          onError={() => setFailed(true)}
        />
      ) : (
        <a
          href={slide.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group absolute inset-0 block outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-primary)]"
        >
          <img src={slide.src} alt="" className="absolute inset-0 size-full object-cover" />
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.55))' }}
          />
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-[color:var(--accent-primary)] shadow-glow transition-transform duration-200 ease-out group-hover:scale-105 group-focus-visible:scale-105 group-active:scale-95 motion-reduce:transition-none">
              {slide.isVideoPost ? <Play className="ml-[3px] size-7 text-white" aria-hidden="true" /> : <ExternalLink className="size-6 text-white" aria-hidden="true" />}
            </span>
            <span className="text-body-s font-medium text-white [text-shadow:0_1px_14px_rgba(0,0,0,0.65)]">
              {slide.isVideoPost ? 'Watch this Reel on Instagram' : 'View this post on Instagram'}
            </span>
          </span>
        </a>
      )}
    </div>
  )
}
