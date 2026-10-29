import { useRef, useState, type KeyboardEvent, type MouseEvent, type TouchEvent } from 'react'
import { Pause, Play } from 'lucide-react'
import { formatTime, seekFraction } from './format-time'

const PALETTE: readonly (readonly [number, number, number])[] = [
  [180, 130, 58], // warm amber
  [190, 100, 68], // terracotta
  [65, 120, 110], // dusty teal
  [110, 130, 82], // muted sage
  [158, 62, 68], // warm burgundy
]

/** Bar position (0..1) to a palette color via a smooth gradient. */
function barColor(t: number, opacity: number): string {
  const scaled = t * (PALETTE.length - 1)
  const lo = Math.floor(scaled)
  const hi = Math.min(lo + 1, PALETTE.length - 1)
  const blend = scaled - lo
  const [r, g, b] = PALETTE[lo]!.map((v, i) => Math.round(v + (PALETTE[hi]![i]! - v) * blend))
  return `rgba(${r},${g},${b},${opacity})`
}

/** Deterministic pseudo-random bar heights seeded from the audio URL. */
export function seededBars(src: string, count = 72): number[] {
  let seed = [...src].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0)
  return Array.from({ length: count }, () => {
    seed = (seed * 1664525 + 1013904223) | 0
    const raw = Math.abs(seed) / 2147483647
    return 0.15 + raw * raw * 0.85
  })
}

type WaveformPlayerProps = { src: string; title?: string; onPlay?: () => void }

export function WaveformPlayer({ src, title, onPlay }: WaveformPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const seekRef = useRef<HTMLDivElement>(null)
  const firedOnPlay = useRef(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const bars = seededBars(src)

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
    } else {
      void audio.play().catch(() => setIsPlaying(false))
      if (!firedOnPlay.current) {
        firedOnPlay.current = true
        onPlay?.()
      }
    }
    setIsPlaying(!isPlaying)
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
    const el = seekRef.current
    if (!audio || !el || !Number.isFinite(audio.duration)) return
    const pct = seekFraction(e, el)
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
  const filledCount = Math.round((progress / 100) * bars.length)

  return (
    <div className="card-glass w-full rounded-xl" style={{ padding: '14px 16px 12px' }}>
      <audio ref={audioRef} src={src} preload="none" onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} className="hidden" />

      {title && (
        <p className="mb-2.5 truncate text-[0.6rem] uppercase leading-none tracking-[0.1em] text-[rgba(212,196,168,0.55)]">{title}</p>
      )}

      <div className="flex items-center gap-3">
        {/* A real 44px button (touch target) around the 40px circle; -m-0.5 keeps the layout. */}
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
          className="group/play -m-0.5 flex size-11 shrink-0 items-center justify-center rounded-full outline-none hover:cursor-pointer focus-visible:ring-2 focus-visible:ring-[color:var(--accent-secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)] touch-manipulation"
        >
          <span
            className="flex size-10 items-center justify-center rounded-full bg-[color:var(--accent-primary)] group-hover/play:bg-[color:var(--accent-primary-hover)] group-active/play:scale-95"
            style={{
              boxShadow: isPlaying
                ? '0 0 0 4px rgba(224,61,42,0.22), 0 0 20px rgba(224,61,42,0.35)'
                : '0 2px 12px rgba(224,61,42,0.3)',
              transition: 'box-shadow 200ms ease, transform 150ms ease, background-color 150ms ease',
            }}
          >
            {isPlaying ? (
              <Pause className="size-4 text-[color:var(--accent-contrast)]" aria-hidden />
            ) : (
              <Play className="size-4 translate-x-px text-[color:var(--accent-contrast)]" aria-hidden />
            )}
          </span>
        </button>

        <div
          ref={seekRef}
          role="slider"
          aria-label="Seek audio"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
          tabIndex={0}
          className="flex h-11 min-w-0 flex-1 cursor-pointer select-none items-center gap-px rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
          onClick={handleSeek}
          onTouchStart={handleSeek}
          onKeyDown={handleKey}
        >
          {bars.map((height, i) => {
            const t = i / (bars.length - 1)
            const filled = i < filledCount
            const isHead = i === filledCount - 1 && isPlaying
            const half = (height * 36) / 2
            const top = filled ? (isHead ? 'rgba(255,255,255,0.95)' : 'var(--accent-primary)') : barColor(t, 0.35)
            const bottom = filled ? (isHead ? 'rgba(255,255,255,0.6)' : 'rgba(224,61,42,0.45)') : barColor(t, 0.18)
            return (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-center gap-px">
                <div className="w-full rounded-t-[2px]" style={{ height: half, background: top, transition: 'background-color 60ms ease' }} />
                <div className="w-full rounded-b-[2px]" style={{ height: half, background: bottom, transition: 'background-color 60ms ease' }} />
              </div>
            )
          })}
        </div>

        <span className="min-w-[68px] shrink-0 text-right text-[0.62rem] leading-none tracking-[0.04em] tabular-nums text-[rgba(212,196,168,0.5)]">
          {formatTime(currentTime)}&nbsp;/&nbsp;{formatTime(duration)}
        </span>
      </div>
    </div>
  )
}
