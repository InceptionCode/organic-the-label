/** `m:ss`; non-finite durations (not loaded yet) read as 0:00. */
export function formatTime(seconds = 0): string {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

type SeekEvent = { clientX: number } | { touches: ArrayLike<{ clientX: number }> }

/** Fraction 0..1 of a pointer position across an element. */
export function seekFraction(e: SeekEvent, el: HTMLElement): number {
  const rect = el.getBoundingClientRect()
  const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? rect.left) : e.clientX
  return Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
}
