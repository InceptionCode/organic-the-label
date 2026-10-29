// UTC so the server render and the hydrated client always print the same date.
const monthYear = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

/** "October 2026" */
export function formatMonthYear(iso: string | null | undefined): string | null {
  const date = parse(iso)
  return date ? monthYear.format(date) : null
}

/** "Oct 27, 2026" */
export function formatShortDate(iso: string | null | undefined): string | null {
  const date = parse(iso)
  return date ? shortDate.format(date) : null
}

// v1 STORE_CATEGORIES labels.
const CATEGORY_LABELS: Record<string, string> = {
  kit: 'Drum Kits',
  beat: 'Beats',
  pack: 'Sample Packs',
  bank: 'Sound Banks',
  plugin: 'VSTs & Plugins',
  suite: 'Suites',
  merch: 'Merchandise',
}

export function categoryLabel(category: string): string | null {
  return CATEGORY_LABELS[category] ?? (category ? category : null)
}
