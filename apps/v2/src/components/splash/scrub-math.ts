// Pure pieces of the session splash scrub (phase 07.7), unit tested in tests/unit/splash.test.ts.

export type FrameSet = { name: 'desktop' | 'mobile'; count: number; path: (i: number) => string }

const pad = (i: number) => String(i).padStart(4, '0')

/** 153 frames, 1600x900, about 6.2 MB. */
export const DESKTOP_FRAMES: FrameSet = {
  name: 'desktop',
  count: 153,
  path: (i) => `/organic-sonics-hero/assets/hero/frame_${pad(i)}.webp`,
}

/** Every other desktop frame, center-cropped to 720x900 for portrait phones: 77 frames, about 1.9 MB. */
export const MOBILE_FRAMES: FrameSet = {
  name: 'mobile',
  count: 77,
  path: (i) => `/organic-sonics-hero/assets/hero-mobile/frame_${pad(i)}.webp`,
}

/** Below the md breakpoint (768px) phones get the lighter set. */
export const MOBILE_FRAMES_QUERY = '(max-width: 767px)'

export const frameSetFor = (narrow: boolean): FrameSet => (narrow ? MOBILE_FRAMES : DESKTOP_FRAMES)

// Tight, responsive scrub: the frame tracks input directly and stops when input stops. A little easing
// removes noise; the per-tick cap stops a big fling from whip-panning.
export const EASE = 0.2
export const MAX_STEP = 0.05
/** Scroll this far past the last frame to enter the site. */
export const COMMIT_MARGIN = 0.16
export const TARGET_MAX = 1 + COMMIT_MARGIN + 0.05
export const WHEEL_SENS = 1 / 2800
export const WHEEL_CLAMP = 50
export const TOUCH_SENS = 1 / 640
export const KEY_STEP = 0.05

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Frame index for a progress in [0, 1], for any frame count. */
export const frameIndex = (progress: number, count: number) => Math.round(clamp(progress, 0, 1) * (count - 1))

export const clampTarget = (target: number) => clamp(target, 0, TARGET_MAX)

/** One deliberate scroll past the end commits. */
export const isCommitted = (target: number) => target > 1 + COMMIT_MARGIN

export const wheelDelta = (deltaY: number) => clamp(deltaY, -WHEEL_CLAMP, WHEEL_CLAMP) * WHEEL_SENS

/** Eases `progress` toward `min(target, 1)`, capped per tick, snapping when close. */
export function stepProgress(progress: number, target: number): number {
  const goal = Math.min(target, 1)
  const next = progress + clamp((goal - progress) * EASE, -MAX_STEP, MAX_STEP)
  return Math.abs(goal - next) < 0.0004 ? goal : next
}

export type Beat = { start: number; end: number; mark: boolean; heading?: string; line?: string }

/** Same copy and timing as v1. */
export const BEATS: Beat[] = [
  { start: 0, end: 0.12, mark: false, heading: 'The studio opens' },
  { start: 0.36, end: 0.56, mark: false, line: 'Every session starts with one sound.' },
  { start: 0.8, end: 1, mark: true, heading: 'Organic Sonics', line: "Elevate your sound. Express what's real." },
]

/** Fade in at the start, out at the end; the final (mark) beat stays once reached. */
export function beatOpacity(beat: Beat, p: number): number {
  const { start: s, end: e, mark } = beat
  const fade = (e - s) * 0.18 || 0.02
  let op = 0
  if (p >= s - fade && p <= e + fade) {
    if (p < s + fade) op = (p - s) / fade
    else if (!mark && p > e - fade) op = (e - p) / fade
    else op = 1
  }
  if (mark && p >= e - fade) op = Math.min(1, (p - s) / fade)
  // The opening line is on screen before any input (v1 started it at 0 opacity until the first tick).
  if (s === 0 && p < fade) op = 1
  return clamp(op, 0, 1)
}
