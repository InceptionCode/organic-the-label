import type { StoreSearch } from './store-search'

// Home "Browse by type" cards: v1 lib/constants.ts STORE_CATEGORIES (label, description, link).
// Named BROWSE_CATEGORIES here because lib/store-search.ts already exports STORE_CATEGORIES (the
// valid /store category values). Copy fix from v1: "plugins, VSTs, synths".
export type BrowseCategory = {
  label: string
  description: string
  search: Pick<StoreSearch, 'category' | 'tags'>
}

export const BROWSE_CATEGORIES: readonly BrowseCategory[] = [
  { label: 'Drum Kits', description: 'Hard-hitting drums, perc loops & one-shots', search: { category: 'kit' } },
  { label: 'Beats', description: 'Full instrumentals ready to license', search: { category: 'beat' } },
  { label: 'Sample Packs', description: 'Curated loops, phrases, samples, one-shots & textures', search: { category: 'pack' } },
  {
    label: 'Sound Banks',
    description: 'Multi-layered sound design collections for plugins, VSTs, synths, and more',
    search: { category: 'bank' },
  },
  {
    label: 'VSTs & Plugins',
    description: 'Select from our list of VSTs, Plugins and synth patches and their presets',
    search: { category: 'plugin' },
  },
  { label: 'Suites', description: 'Bundled producer toolkit collections', search: { category: 'suite' } },
  { label: 'Merchandise', description: 'Wear the brand', search: { category: 'merch' } },
  { label: 'Free', description: 'Complimentary resources for all producers', search: { tags: 'free' } },
]

/** Home membership benefits (v1 MEMBERSHIP_BENEFITS). */
export const MEMBERSHIP_BENEFITS = [
  'Exclusive samples & kits not in the public store',
  'Reward points on every purchase',
  'Early access to new drops & limited releases',
  'Educational videos & production tips',
  'Member-only discounts and deals',
] as const
