import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type TouchEvent } from 'react'
import { Pause, Play } from 'lucide-react'
import { cn } from '~/ui/cn'
import { claimPlayback, releasePlayback, type PlaybackSource } from './exclusive-playback'
import { formatTime, seekFraction } from './format-time'
import { seededBars } from './waveform-player'

type AudioPlayerProps = {
  src: string
  title?: string
  /** Fired once, on the first play. */
  onPlay?: () => void
  /** Fired on every play (the compositions list selects the row). */
  onStart?: () => void
  /** What is playing, for the `audio_preview_played` event (exclusive-playback reports play starts). */
  source?: PlaybackSource
  className?: string
}

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]'

export function AudioPlayer({ src, title, onPlay, onStart, source, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const firedOnPlay = useRef(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const bars = seededBars(src, 48)

  useEffect(() => {
    const audio = audioRef.current
    return () => {
      if (!audio) return
      audio.pause()
      releasePlayback(audio)
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (!audio.paused) {
      audio.pause()
      return
    }
    claimPlayback(audio, source)
    void audio.play().catch(() => setIsPlaying(false))
    onStart?.()
    if (!firedOnPlay.current) {
      firedOnPlay.current = true
      onPlay?.()
    }
  }

  const handleTimeUpdate = () => {
    const audio = audioRef.current
    if (!audio) return
    setProgress(Number.isFinite(audio.duration) && audio.duration > 0 ? (audio.currentTime / audio.duration) * 100 : 0)
    setCurrentTime(audio.currentTime)
    setDuration(audio.duration)
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setProgress(0)
    setCurrentTime(0)
  }

  const handleSeek = (e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    const track = trackRef.current
    if (!audio || !track || !Number.isFinite(audio.duration)) return
    const pct = seekFraction(e, track)
    audio.currentTime = pct * audio.duration
    setProgress(pct * 100)
  }

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(audio.duration)) return
    if (e.key === 'ArrowRight') audio.currentTime = Math.min(audio.duration, audio.currentTime + 5)
    if (e.key === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 5)
  }

  if (!src) return null
  const filled = Math.round((progress / 100) * bars.length)

  return (
    <div className={cn('flex w-full min-w-0 items-center gap-3', className)}>
      <audio
        ref={audioRef}
        src={src}
        preload="none"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="hidden"
      />

      <button
        type="button"
        onClick={togglePlay}
        aria-pressed={isPlaying}
        aria-label={isPlaying ? `Pause ${title ?? 'preview'}` : `Play ${title ?? 'preview'}`}
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-[2px] border transition-[color,border-color,transform] duration-150 hover:cursor-pointer active:scale-[0.94] touch-manipulation',
          isPlaying
            ? 'border-[color:var(--accent-primary)] text-[color:var(--accent-text)]'
            : 'border-[color:var(--border-strong)] text-[color:var(--text-primary)] hover:border-[color:var(--text-primary)]',
          focusRing,
        )}
      >
        {isPlaying ? <Pause className="size-4" aria-hidden /> : <Play className="size-4 translate-x-px" aria-hidden />}
      </button>

      <div
        ref={trackRef}
        role="slider"
        aria-label={title ? `Seek ${title}` : 'Seek'}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        tabIndex={0}
        className={cn('flex h-11 min-w-0 flex-1 cursor-pointer select-none items-center gap-px overflow-hidden rounded-sm', focusRing)}
        onClick={handleSeek}
        onTouchStart={handleSeek}
        onKeyDown={handleKey}
      >
        {bars.map((height, i) => (
          <span
            key={i}
            aria-hidden
            className={cn(
              'block min-w-0 flex-1 transition-colors duration-100',
              i < filled ? 'bg-[color:var(--accent-primary)]' : 'bg-[color:color-mix(in_srgb,var(--text-primary)_22%,transparent)]',
            )}
            style={{ height: `${Math.round(height * 28)}px` }}
          />
        ))}
      </div>

      <span className="w-[5.5rem] shrink-0 text-right text-body-s tabular-nums text-muted max-sm:hidden">
        {formatTime(currentTime)}&nbsp;/&nbsp;{formatTime(duration)}
      </span>
    </div>
  )
}
