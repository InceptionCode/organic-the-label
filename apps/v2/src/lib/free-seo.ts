// Titles and descriptions for /free and /free/$slug (pages/free.md, SEO). Pure, unit tested.

export const FREE_DEFAULT_TITLE = 'Free Starter Kit for Producers'
export const FREE_DESCRIPTION =
  'Grab a free producer kit from Organic Sonics: drum one-shots, melodic loops, and synth presets. Enter your email and the download link lands in your inbox.'
const DESCRIPTION_SUFFIX = ' Free download from Organic Sonics, delivered to your inbox.'
// formatTitle appends " | Organic Sonics" (17 characters); keep the full title under 60.
const TITLE_BUDGET = 59 - ' | Organic Sonics'.length

/** Cut at a word boundary to at most `max` characters (no ellipsis; a description reads whole). */
export function cutAtWord(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const slice = clean.slice(0, max + 1)
  const space = slice.lastIndexOf(' ')
  return (space > 0 ? slice.slice(0, space) : clean.slice(0, max)).replace(/[\s,;:.-]+$/, '')
}

/** /free: "Free Download: {name}" when a resource is shown, else the default title. */
export function freeIndexTitle(name: string | null | undefined): string {
  if (!name) return FREE_DEFAULT_TITLE
  return cutAtWord(`Free Download: ${name}`, TITLE_BUDGET)
}

export function freeSlugTitle(name: string): string {
  return cutAtWord(name, TITLE_BUDGET)
}

/** /free/$slug: the description cut to 155 at a word boundary, padded when under 120. */
export function freeSlugDescription(description: string | null | undefined): string {
  if (!description?.trim()) return FREE_DESCRIPTION
  let text = cutAtWord(description, 155)
  if (text.length < 120) {
    if (!/[.!?]$/.test(text)) text += '.'
    text = cutAtWord(`${text}${DESCRIPTION_SUFFIX}`, 160)
  }
  return text
}
