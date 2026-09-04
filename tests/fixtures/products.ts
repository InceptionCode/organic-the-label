import type { Product } from '@/lib/schemas'

/**
 * Minimal product fixtures for unit and integration tests.
 * Shapes match lib/schemas.ts ProductSchema exactly.
 *
 * TODO: Add 2-3 more fixtures with different categories/tags to support filter tests.
 */

export const mockProduct: Product = {
  id: 'gid://shopify/Product/1',
  variantId: 'gid://shopify/ProductVariant/1',
  name: 'Sample Drum Kit',
  handle: 'sample-drum-kit',
  description: 'A high-quality drum kit with 24-bit WAV files.',
  price: 29.99,
  category: 'kit',
  image: {
    url: 'https://placehold.co/600x400',
    altText: 'Sample Drum Kit cover',
    width: 600,
    height: 400,
  },
  audio_preview: {
    preview_title: 'Demo Preview',
    preview_url: 'https://example.com/preview.mp3',
  },
  tags: ['trap', 'hiphop'],
  is_exclusive: false,
  whats_included: [
    { label: '24-bit WAV files', icon: '🎵' },
    { label: 'MIDI files', description: 'Full MIDI stems included' },
  ],
  created_at: '2024-01-01T00:00:00.000Z',
}

export const mockExclusiveProduct: Product = {
  ...mockProduct,
  id: 'gid://shopify/Product/2',
  variantId: 'gid://shopify/ProductVariant/2',
  name: 'Exclusive Ambient Pack',
  handle: 'exclusive-ambient-pack',
  category: 'pack',
  price: 49.99,
  tags: ['ambient', 'melodic'],
  is_exclusive: true,
}

export const mockFreeProduct: Product = {
  ...mockProduct,
  id: 'gid://shopify/Product/3',
  variantId: 'gid://shopify/ProductVariant/3',
  name: 'Free Starter Kit',
  handle: 'free-starter-kit',
  category: 'kit',
  price: 0,
  tags: ['free'],
  is_exclusive: false,
}

// TODO: add a beat product fixture for category filter tests
// TODO: add a merch product fixture once physical product tests are needed
