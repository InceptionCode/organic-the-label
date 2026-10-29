import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import { AddToCartButton } from '~/components/product/add-to-cart-button'
import { LazyAuroraWaves, LazyLiveWaveform } from '~/components/visuals/lazy'
import { formatMoney } from '~/lib/format'
import { productQueries } from '~/queries/products'
import type { AudioPreview, ProductSummary } from '~/server/shopify/types'
import { ButtonLink } from '~/ui/button'
import { cn } from '~/ui/cn'

const LINES = ['PREMIUM SOUNDS', 'FOR MODERN PRODUCERS'] as const
const MAX_TRACKS = 8

const rise = (delay: number, distance: number, duration: number) =>
  ({ '--delay': `${delay}s`, '--rise': `${distance}px`, '--dur': `${duration}s` }) as CSSProperties

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]'

const squareButton = cn(
  'flex size-11 shrink-0 items-center justify-center rounded-sm border border-[color:var(--border-strong)] text-primary transition-soft hover:cursor-pointer hover:border-[color:var(--text-primary)] active:scale-[0.96] touch-manipulation',
  focusRing,
)

/**
 * Home hero. Two background layers: a faint AuroraWaves atmosphere and the live waveform, which
 * follows the latest drop's audio previews while they play. Headline anchored bottom-left.
 */
export function Hero({ latest }: { latest?: ProductSummary }) {
  // The full preview list is fetched on the first play, not on page load; most visitors never press play.
  const [requested, setRequested] = useState(false)
  const tracks = usePreviewTracks(latest, requested)
  const { audioRef, index, status, toggle, next, onPlaying, onPause, onEnded, onError, getAnalyser } = usePreviewPlaylist(tracks)
  const onToggle = () => {
    setRequested(true)
    toggle()
  }

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden bg-canvas lg:min-h-[calc(100svh-72px)]"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-90">
        <LazyAuroraWaves className="absolute inset-0" speed={0.35} glow={3.5} resolutionScale={0.5} />
      </div>
      {/* Keeps the headline and copy on near-black regardless of where the aurora drifts. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(to top, var(--bg-canvas) 12%, color-mix(in srgb, var(--bg-canvas) 55%, transparent) 45%, transparent 80%)' }}
      />

      <div className="relative z-10 flex flex-1 flex-col justify-end pt-6">
        <div className="relative h-[clamp(140px,20svh,300px)]">
          <LazyLiveWaveform className="absolute inset-0" getAnalyser={getAnalyser} />
        </div>

        <div className="content-container pb-8 pt-6 md:pb-10">
          {latest && tracks.length > 0 && (
            <PreviewPlayer product={latest} tracks={tracks} index={index} status={status} onToggle={onToggle} onNext={next} />
          )}

          <h1 id="hero-heading" className="text-display-xl text-primary">
            {LINES.map((line, i) => (
              <span key={line} className="os-hero-rise block" style={rise(0.2 + i * 0.12, 40, 0.8)}>
                {line}
              </span>
            ))}
          </h1>

          <div
            className="os-hero-rise mt-8 grid gap-6 border-t border-[color:var(--border-default)] pt-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end"
            style={rise(0.5, 16, 0.6)}
          >
            <p className="max-w-[52ch] text-body-l text-secondary">
              Curated beats, kits, packs, sound banks, and resources built for serious creators. Elevate your sound.
              Express what&apos;s real: <strong className="whitespace-nowrap font-medium text-primary">Organic Sonics</strong>.
            </p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              {/* One primary per view: the end-of-playlist "Add to cart" takes the red while it shows. */}
              <ButtonLink to="/store" size="lg" variant={status === 'ended' ? 'outline' : 'default'}>
                Browse kits
              </ButtonLink>
              <Link
                to="/signup"
                className={cn('link-underline inline-flex min-h-11 items-center rounded-sm text-body-m text-primary', focusRing)}
              >
                Join free
              </Link>
            </div>
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        preload="none"
        crossOrigin="anonymous"
        onPlaying={onPlaying}
        onPause={onPause}
        onEnded={onEnded}
        onError={onError}
        className="hidden"
      />
    </section>
  )
}

type PreviewPlayerProps = {
  product: ProductSummary
  tracks: AudioPreview[]
  index: number
  status: Status
  onToggle: () => void
  onNext: () => void
}

/**
 * Play/pause stays mounted in every state (it becomes "Play again" at the end), so keyboard focus
 * never drops to the body when the row changes. The skip button uses aria-disabled for the same reason.
 */
function PreviewPlayer({ product, tracks, index, status, onToggle, onNext }: PreviewPlayerProps) {
  const multi = tracks.length > 1
  const started = status !== 'idle'
  const playing = status === 'playing'
  const ended = status === 'ended'
  const track = tracks[index] ?? tracks[0]
  const nextTrack = tracks[index + 1]
  const price = product.price
    ? Number(product.price.amount) === 0
      ? 'free'
      : formatMoney(product.price.amount, product.price.currencyCode)
    : null

  const toggleLabel = ended
    ? `Play ${product.title} previews again`
    : `${playing ? 'Pause' : 'Play'} ${product.title} preview`

  return (
    <div className="os-hero-rise mb-6 flex flex-wrap items-center gap-x-8 gap-y-4" style={rise(0.1, 12, 0.6)}>
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={ended ? undefined : playing}
          aria-label={toggleLabel}
          className={cn(squareButton, playing && 'border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)]')}
        >
          {ended ? (
            <RotateCcw className="size-4" aria-hidden />
          ) : playing ? (
            <Pause className="size-4" aria-hidden />
          ) : (
            <Play className="size-4 translate-x-px" aria-hidden />
          )}
        </button>
        {multi && started && !ended && (
          <button
            type="button"
            onClick={onNext}
            aria-disabled={!nextTrack || undefined}
            aria-label={nextTrack ? `Next preview: ${nextTrack.preview_title}` : 'Last preview'}
            className={cn(squareButton, !nextTrack && 'cursor-not-allowed opacity-40 hover:border-[color:var(--border-strong)] active:scale-100')}
          >
            <SkipForward className="size-4" aria-hidden />
          </button>
        )}

        <div className="min-w-0 text-label" aria-live="polite" aria-atomic="true">
          {ended ? (
            <p className="text-body-m text-primary">You&apos;ve heard the whole pack.</p>
          ) : started ? (
            <>
              <p className="text-primary">{multi ? `Track ${index + 1} of ${tracks.length}` : 'Now playing'}</p>
              <p className="max-w-[24ch] truncate sm:max-w-[40ch]" title={track.preview_title}>
                {track.preview_title}
              </p>
            </>
          ) : (
            <p>
              <span className="text-primary">Listen</span>{' '}
              <Link
                to="/store/$handle"
                params={{ handle: product.handle }}
                className={cn('link-underline rounded-sm text-secondary hover:text-primary', focusRing)}
              >
                {product.title}
              </Link>
              {multi ? <>, {tracks.length} previews</> : <span className="max-sm:hidden">, {track.preview_title}</span>}
            </p>
          )}
        </div>
      </div>

      {ended ? (
        <div className="os-hero-rise flex flex-wrap items-center gap-x-8 gap-y-3" style={rise(0, 16, 0.6)}>
          <AddToCartButton variantId={product.variantId} openDrawer productName={product.title} className="flex-none" />
          <Link
            to="/store/$handle"
            params={{ handle: product.handle }}
            className={cn('link-underline inline-flex min-h-11 items-center rounded-sm text-body-m text-primary', focusRing)}
          >
            View kit
          </Link>
        </div>
      ) : (
        started && (
          <Link
            to="/store/$handle"
            params={{ handle: product.handle }}
            className={cn('link-underline inline-flex min-h-11 items-center rounded-sm text-body-s text-primary', focusRing)}
          >
            Get {product.title}
            {price ? `, ${price}` : ''}
          </Link>
        )
      )}
    </div>
  )
}

/**
 * The latest drop's previews, up to 8, in product order. The list summary only carries the first
 * preview, so playback starts on that and the full list joins once the product query (enabled on the
 * first play) resolves. The playlist reads tracks through a ref, so auto-advance picks up the new list.
 */
function usePreviewTracks(latest: ProductSummary | undefined, requested: boolean): AudioPreview[] {
  const { data } = useQuery({ ...productQueries.byHandle(latest?.handle ?? ''), enabled: requested && !!latest?.audioPreview })
  const full = data?.audioPreviews ?? []
  if (full.length > 0) return full.slice(0, MAX_TRACKS)
  return latest?.audioPreview ? [latest.audioPreview] : []
}

type Status = 'idle' | 'playing' | 'paused' | 'ended'

/**
 * One hidden <audio> routed through one Web Audio analyser; tracks swap `src` on the same element,
 * so the analyser stays connected across the playlist. The AudioContext is created on the first
 * play (a user gesture, as browsers require). Shopify's CDN sends `access-control-allow-origin: *`,
 * so `crossOrigin="anonymous"` keeps the analyser data readable.
 */
function usePreviewPlaylist(tracks: AudioPreview[]) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const tracksRef = useRef(tracks)
  const indexRef = useRef(0)
  const playingRef = useRef(false)
  const endedRef = useRef(false)
  // True while a src swap is loading: the element can report `pause` mid-swap, which is not a user pause.
  const switchingRef = useRef(false)
  const [index, setIndex] = useState(0)
  const [status, setStatus] = useState<Status>('idle')

  useEffect(() => {
    tracksRef.current = tracks
  }, [tracks])

  const playAt = useCallback((i: number) => {
    const el = audioRef.current
    const track = tracksRef.current[i]
    if (!el || !track) return
    if (!ctxRef.current) {
      const ctx = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      ctx.createMediaElementSource(el).connect(analyser)
      analyser.connect(ctx.destination)
      ctxRef.current = ctx
      analyserRef.current = analyser
    }
    if (el.getAttribute('src') !== track.preview_url) {
      switchingRef.current = true
      el.src = track.preview_url
    }
    void ctxRef.current.resume()
    indexRef.current = i
    endedRef.current = false
    playingRef.current = true
    setIndex(i)
    setStatus('playing')
    el.play().catch((err: unknown) => {
      // A newer src swap aborts the previous play() promise; that is not a failure.
      if (err instanceof DOMException && err.name === 'AbortError') return
      switchingRef.current = false
      playingRef.current = false
      setStatus('paused')
    })
  }, [])

  const toggle = useCallback(() => {
    if (playingRef.current) {
      audioRef.current?.pause()
      return
    }
    playAt(endedRef.current ? 0 : indexRef.current)
  }, [playAt])

  const next = useCallback(() => {
    if (indexRef.current + 1 < tracksRef.current.length) playAt(indexRef.current + 1)
  }, [playAt])

  const onPlaying = useCallback(() => {
    switchingRef.current = false
  }, [])

  const onPause = useCallback(() => {
    const el = audioRef.current
    // `pause` also fires right before `ended` and during a src swap; onEnded/playAt own those.
    if (!el || el.ended || switchingRef.current) return
    playingRef.current = false
    setStatus('paused')
  }, [])

  const onEnded = useCallback(() => {
    const nextIndex = indexRef.current + 1
    if (nextIndex < tracksRef.current.length) {
      playAt(nextIndex)
      return
    }
    playingRef.current = false
    endedRef.current = true
    setStatus('ended')
  }, [playAt])

  const onError = useCallback(() => {
    switchingRef.current = false
    playingRef.current = false
    setStatus('paused')
  }, [])

  const getAnalyser = useCallback(() => (playingRef.current ? analyserRef.current : null), [])

  // Route change or unmount: stop the audio and release the context.
  useEffect(() => {
    const el = audioRef.current
    return () => {
      el?.pause()
      void ctxRef.current?.close()
    }
  }, [])

  return { audioRef, index, status, toggle, next, onPlaying, onPause, onEnded, onError, getAnalyser }
}
