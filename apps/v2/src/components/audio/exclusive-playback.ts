import { track } from '~/lib/track'

// One preview at a time across the page: whoever starts playing claims playback and the previous
// element is paused. Module state only (client side); elements release on pause or unmount.
let current: HTMLMediaElement | null = null

export type PlaybackSource = {
  surface: 'hero' | 'card' | 'product' | 'composition'
  title: string
  handle?: string
  productId?: string
  slug?: string
}

// The src each element last reported, so pressing play again before any audio has loaded is not a
// second play.
const lastReported = new WeakMap<HTMLMediaElement, string>()

/**
 * A play start, not a resume: the element is at 0 on a track it has not reported yet, or it finished
 * and is replaying. Call after any src swap, before `play()`.
 */
function isPlayStart(el: HTMLMediaElement, src: string) {
  if (el.ended) return true
  if (el.currentTime > 0) return false
  return lastReported.get(el) !== src
}

export function claimPlayback(el: HTMLMediaElement, source?: PlaybackSource) {
  if (current && current !== el && !current.paused) current.pause()
  current = el
  if (!source) return
  const src = el.getAttribute('src') ?? el.currentSrc
  if (!isPlayStart(el, src)) return
  lastReported.set(el, src)
  track('audio_preview_played', source)
}

export function releasePlayback(el: HTMLMediaElement) {
  if (current === el) current = null
}
