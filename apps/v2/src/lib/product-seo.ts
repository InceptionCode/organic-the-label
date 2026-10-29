// Title and description rules for /store/$handle (pages/product.md, SEO).

/** Longest product name that keeps "{name} | Organic Sonics" under 60 characters. */
export const PRODUCT_TITLE_MAX = 43
const DESCRIPTION_MAX = 155
const DESCRIPTION_MIN = 120
const SUFFIX = ' Instant download from Organic Sonics.'

/** Cut at a word boundary to at most `max` characters (no ellipsis). */
function cutAtWord(text: string, max: number): string {
  if (text.length <= max) return text
  const slice = text.slice(0, max + 1)
  const lastSpace = slice.lastIndexOf(' ')
  return (lastSpace > max * 0.5 ? slice.slice(0, lastSpace) : text.slice(0, max)).replace(/[\s,;:.-]+$/, '')
}

export function productSeoTitle(name: string): string {
  return cutAtWord(name.replace(/\s+/g, ' ').trim(), PRODUCT_TITLE_MAX)
}

/**
 * Plain description collapsed to one line, cut to 155 characters at a word boundary with "..."
 * when cut; short ones get the instant-download suffix; empty ones get a category fallback.
 */
export function productSeoDescription(p: { title: string; description: string; category: string }): string {
  const text = p.description.replace(/\s+/g, ' ').trim()
  if (!text) {
    const article = /^[aeiou]/i.test(p.category) ? 'an' : 'a'
    return `${p.title}: ${article} ${p.category || 'product'} from Organic Sonics. Preview it, then download instantly after checkout.`
  }
  if (text.length > DESCRIPTION_MAX) return `${cutAtWord(text, DESCRIPTION_MAX - 3)}...`
  if (text.length < DESCRIPTION_MIN) {
    const base = /[.!?]$/.test(text) ? text : `${text}.`
    return `${base}${SUFFIX}`
  }
  return text
}
