import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type TouchEvent } from 'react'
import { Pause, Play } from 'lucide-react'
import type { AudioPreview } from '~/server/shopify/types'
import { cn } from '~/ui/cn'
import { claimPlayback, releasePlayback } from './exclusive-playback'
import { formatTime, seekFraction } from './format-time'
import { seededBars } from './waveform-player'

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]'

type Status = 'idle' | 'playing' | 'paused'

type PreviewTracklistProps = {
  previews: AudioPreview[]
  headingId: string
  /** Fired once per track, on its first play (tracking hooks in here in phase 06). */
  onPreviewPlay?: (previewTitle: string) => void
}

/**
 * Product previews as one tracklist: a single waveform for the current track, then every track as a
 * numbered row. One <audio> element swaps `src`; `ended` advances to the next track and the last one
 * stops. Joins the page-wide one-at-a-time playback (product cards pause this and vice versa).
 */
export function PreviewTracklist({ previews, headingId, onPreviewPlay }: PreviewTracklistProps) {
  const { audioRef, index, status, time, duration, durations, toggleAt, seekTo, seekBy, onPlaying, onPause, onEnded, onError, onTimeUpdate, onLoadedMetadata } =
    usePlaylist(previews, onPreviewPlay)
  const multi = previews.length > 1
  const current = previews[index] ?? previews[0]
  if (!current) return null

  return (
    <div>
      <div className="flex items-end justify-between gap-6">
        <h2 id={headingId} className="text-h2 text-primary">
          PREVIEWS
        </h2>
        {multi && <p className="text-label">{previews.length} tracks</p>}
      </div>

      <Waveform
        title={current.preview_title}
        src={current.preview_url}
        status={status}
        time={time}
        duration={duration}
        onToggle={() => toggleAt(index)}
        onSeekTo={seekTo}
        onSeekBy={seekBy}
      />

      {multi && (
        <ol className="border-b border-[color:var(--border-subtle)]">
          {previews.map((preview, i) => {
            const isCurrent = i === index && status !== 'idle'
            const isPlaying = isCurrent && status === 'playing'
            return (
              <li key={`${preview.preview_url}-${i}`} className="border-t border-[color:var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => toggleAt(i)}
                  aria-pressed={isPlaying}
                  aria-label={`${isPlaying ? 'Pause' : 'Play'} ${preview.preview_title}`}
                  className={cn(
                    'group/row relative grid min-h-14 w-full grid-cols-[2.25rem_minmax(0,1fr)_auto_2.75rem] items-center gap-3 rounded-sm text-left transition-colors duration-150 hover:cursor-pointer touch-manipulation',
                    focusRing,
                  )}
                >
                  <span
                    aria-hidden
                    className={cn('pl-1 text-body-s tabular-nums', isCurrent ? 'text-[color:var(--accent-text)]' : 'text-muted')}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={cn(
                      'truncate text-body-m transition-colors duration-150',
                      isCurrent ? 'text-primary' : 'text-secondary group-hover/row:text-[color:var(--text-primary)]',
                    )}
                  >
                    {preview.preview_title}
                  </span>
                  <span aria-hidden className="text-body-s tabular-nums text-muted">
                    {durations[preview.preview_url] ? formatTime(durations[preview.preview_url]) : ''}
                  </span>
                  {/* Plain icon, no box: the whole row is the button, and the waveform's button is the one filled red control. */}
                  <span
                    aria-hidden
                    className={cn(
                      'flex size-10 items-center justify-center justify-self-end transition-[color,transform] duration-150 group-active/row:scale-[0.9]',
                      isCurrent ? 'text-[color:var(--accent-text)]' : 'text-muted group-hover/row:text-[color:var(--text-primary)]',
                    )}
                  >
                    {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 translate-x-px" />}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      )}

      <audio
        ref={audioRef}
        preload="none"
        onPlaying={onPlaying}
        onPause={onPause}
        onEnded={onEnded}
        onError={onError}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        className="hidden"
      />
    </div>
  )
}

type WaveformProps = {
  title: string
  src: string
  status: Status
  time: number
  duration: number
  onToggle: () => void
  onSeekTo: (fraction: number) => void
  onSeekBy: (seconds: number) => void
}

/** Big play/pause for the current track, its bar waveform (a seek slider) and the time. */
function Waveform({ title, src, status, time, duration, onToggle, onSeekTo, onSeekBy }: WaveformProps) {
  const seekRef = useRef<HTMLDivElement>(null)
  const playing = status === 'playing'
  const bars = seededBars(src, 96)
  const progress = duration > 0 ? time / duration : 0
  const filled = Math.round(progress * bars.length)

  const seek = (e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
    if (seekRef.current) onSeekTo(seekFraction(e, seekRef.current))
  }
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') onSeekBy(5)
    if (e.key === 'ArrowLeft') onSeekBy(-5)
  }

  return (
    <div className="mb-2 mt-6">
      <p className="mb-3 truncate text-label" aria-live="polite">
        {status === 'idle' ? <>Start with <span className="text-primary">{title}</span></> : <span className="text-primary">{title}</span>}
      </p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={playing}
          aria-label={`${playing ? 'Pause' : 'Play'} ${title}`}
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-[2px] bg-[color:var(--accent-primary)] text-[color:var(--accent-contrast)] transition-[background-color,transform] duration-150 hover:cursor-pointer hover:bg-[color:var(--accent-primary-hover)] active:scale-[0.94] touch-manipulation',
            focusRing,
          )}
        >
          {playing ? <Pause className="size-5" aria-hidden /> : <Play className="size-5 translate-x-px" aria-hidden />}
        </button>

        <div
          ref={seekRef}
          role="slider"
          aria-label={`Seek ${title}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`}
          tabIndex={0}
          onClick={seek}
          onTouchStart={seek}
          onKeyDown={onKey}
          className={cn('flex h-14 min-w-0 flex-1 cursor-pointer select-none items-center gap-[2px] rounded-sm', focusRing)}
        >
          {bars.map((h, i) => (
            <span
              key={i}
              aria-hidden
              className={cn(
                'block w-full flex-1 origin-center transition-colors duration-100',
                i < filled ? 'bg-[color:var(--accent-primary)]' : 'bg-[color:color-mix(in_srgb,var(--text-primary)_22%,transparent)]',
                i === filled - 1 && playing && 'bg-[color:var(--text-primary)]',
              )}
              style={{ height: `${Math.round(h * 100)}%` }}
            />
          ))}
        </div>

        <span className="w-[5.5rem] shrink-0 text-right text-body-s tabular-nums text-muted max-sm:hidden">
          {formatTime(time)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  )
}

function usePlaylist(previews: AudioPreview[], onPreviewPlay?: (title: string) => void) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const indexRef = useRef(0)
  // True while a src swap loads: the element can report `pause` mid-swap, which is not a user pause.
  const switchingRef = useRef(false)
  const playedRef = useRef(new Set<string>())
  const [index, setIndex] = useState(0)
  const [status, setStatus] = useState<Status>('idle')
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [durations, setDurations] = useState<Record<string, number>>({})

  const playAt = useCallback(
    (i: number) => {
      const el = audioRef.current
      const track = previews[i]
      if (!el || !track) return
      if (el.getAttribute('src') !== track.preview_url) {
        switchingRef.current = true
        el.src = track.preview_url
        setTime(0)
        setDuration(0)
      }
      claimPlayback(el)
      indexRef.current = i
      setIndex(i)
      setStatus('playing')
      if (!playedRef.current.has(track.preview_url)) {
        playedRef.current.add(track.preview_url)
        onPreviewPlay?.(track.preview_title)
      }
      el.play().catch((err: unknown) => {
        // A newer src swap aborts the previous play() promise; that is not a failure.
        if (err instanceof DOMException && err.name === 'AbortError') return
        switchingRef.current = false
        setStatus('paused')
      })
    },
    [previews, onPreviewPlay],
  )

  const toggleAt = useCallback(
    (i: number) => {
      const el = audioRef.current
      if (el && i === indexRef.current && !el.paused) {
        el.pause()
        return
      }
      playAt(i)
    },
    [playAt],
  )

  const seekTo = useCallback((fraction: number) => {
    const el = audioRef.current
    if (!el || !Number.isFinite(el.duration)) return
    el.currentTime = fraction * el.duration
    setTime(el.currentTime)
  }, [])

  const seekBy = useCallback((seconds: number) => {
    const el = audioRef.current
    if (!el || !Number.isFinite(el.duration)) return
    el.currentTime = Math.min(el.duration, Math.max(0, el.currentTime + seconds))
    setTime(el.currentTime)
  }, [])

  const onPlaying = useCallback(() => {
    switchingRef.current = false
    setStatus('playing')
  }, [])

  const onPause = useCallback(() => {
    const el = audioRef.current
    // `pause` also fires right before `ended` and during a src swap; onEnded/playAt own those.
    if (!el || el.ended || switchingRef.current) return
    setStatus('paused')
  }, [])

  const onEnded = useCallback(() => {
    const next = indexRef.current + 1
    if (next < previews.length) {
      playAt(next)
      return
    }
    setStatus('paused')
    setTime(0)
  }, [playAt, previews.length])

  const onError = useCallback(() => {
    switchingRef.current = false
    setStatus('paused')
  }, [])

  const onTimeUpdate = useCallback(() => {
    const el = audioRef.current
    if (el) setTime(el.currentTime)
  }, [])

  const onLoadedMetadata = useCallback(() => {
    const el = audioRef.current
    if (!el || !Number.isFinite(el.duration)) return
    setDuration(el.duration)
    const src = el.getAttribute('src')
    if (src) setDurations((d) => (d[src] === el.duration ? d : { ...d, [src]: el.duration }))
  }, [])

  // Route change or unmount: stop the audio and give up the page-wide playback slot.
  useEffect(() => {
    const el = audioRef.current
    return () => {
      if (!el) return
      el.pause()
      releasePlayback(el)
    }
  }, [])

  return { audioRef, index, status, time, duration, durations, toggleAt, seekTo, seekBy, onPlaying, onPause, onEnded, onError, onTimeUpdate, onLoadedMetadata }
}
