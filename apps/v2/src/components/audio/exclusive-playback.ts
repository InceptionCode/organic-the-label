// One preview at a time across the page: whoever starts playing claims playback and the previous
// element is paused. Module state only (client side); elements release on pause or unmount.
let current: HTMLMediaElement | null = null

export function claimPlayback(el: HTMLMediaElement) {
  if (current && current !== el && !current.paused) current.pause()
  current = el
}

export function releasePlayback(el: HTMLMediaElement) {
  if (current === el) current = null
}
