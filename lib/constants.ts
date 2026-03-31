import type { ProductCategories } from '@/lib/schemas';
export const navLinks = [
  { name: 'Explore', href: '/explore' },
  { name: 'Store', href: '/store' },
];


export type StoreCategory = {
  label: string;
  description: string;
  href: string;
  category: ProductCategories;
};

export const STORE_CATEGORIES: StoreCategory[] = [
  {
    label: 'Drum Kits',
    description: 'Hard-hitting drums, perc loops & one-shots',
    href: '/store?category=kit',
    category: 'kit',
  },
  {
    label: 'Beats',
    description: 'Full instrumentals ready to license',
    href: '/store?category=beat',
    category: 'beat',
  },
  {
    label: 'Sample Packs',
    description: 'Curated loops, phrases, samples, one-shots & textures',
    href: '/store?category=pack',
    category: 'pack',
  },
  {
    label: 'Sound Banks',
    description: 'Multi-layered sound design collections for plugins, VSTs,synths, and more',
    href: '/store?category=bank',
    category: 'bank',
  },
  {
    label: 'VSTs & Plugins',
    description: 'Select from our list of VSTs, Plugins and synth patches and their presets',
    href: '/store?category=plugin',
    category: 'plugin',
  },
  {
    label: 'Suites',
    description: 'Bundled producer toolkit collections',
    href: '/store?category=suite',
    category: 'suite',
  },
  {
    label: 'Merchandise',
    description: 'Wear the brand',
    href: '/store?category=merch',
    category: 'merch',
  },
  {
    label: 'Free',
    description: 'Complimentary resources for all producers',
    href: '/store?category=free',
    category: 'free',
  },
];

export const ANON_COOKIE_NAME = "anon_token";
export const ANON_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
export const RECOVERY_COOKIE_NAME = "recovery_token";
export const RECOVERY_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days