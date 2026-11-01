export const DEFAULT_NEXT = '/explore'

// Accepts only same-origin paths with a single leading slash. Anything else falls back to /explore.
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith('/')) return DEFAULT_NEXT
  if (next.startsWith('//') || next.startsWith('/\\')) return DEFAULT_NEXT
  if (/[\u0000-\u001f\\]/.test(next)) return DEFAULT_NEXT
  try {
    const url = new URL(next, 'http://localhost')
    if (url.origin !== 'http://localhost') return DEFAULT_NEXT
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return DEFAULT_NEXT
  }
}
