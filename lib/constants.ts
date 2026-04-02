import type { ProductCategories } from '@/lib/schemas';

/** Normalized RGB tuples (0–1) for WebGL shaders and 3D visuals (e.g. EmailVisual). */
export type BrandRgbNormalized = [number, number, number];

export const BRAND_RED_NORM: BrandRgbNormalized = [0.784, 0.208, 0.122]; // #C8351F
export const BRAND_RED_HOT_NORM: BrandRgbNormalized = [1.0, 0.32, 0.16];
export const BRAND_RED_DEEP_NORM: BrandRgbNormalized = [0.51, 0.098, 0.098]; // #831919
export const BRAND_CREAM_NORM: BrandRgbNormalized = [0.851, 0.78, 0.655]; // #D9C7A7
export const BRAND_BEIGE_NORM: BrandRgbNormalized = [0.969, 0.953, 0.922]; // #F7F3EB

/** Canvas-style RGB stops (0–255) for waveform bars and smooth gradient interpolation. */
export const BRAND_WAVEFORM_PALETTE_RGB: [number, number, number][] = [
  [180, 130, 58], // warm amber
  [190, 100, 68], // terracotta
  [65, 120, 110], // dusty teal
  [110, 130, 82], // muted sage
  [158, 62, 68], // warm burgundy
];

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