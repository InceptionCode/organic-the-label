import type { Composition, CompositionListItem } from '@/lib/schemas'

/**
 * Composition fixtures for unit and integration tests.
 * Shapes match lib/schemas.ts CompositionSchema / CompositionListItem.
 */

export const mockComposition: Composition = {
  id: '00000000-0000-0000-0000-000000000001',
  slug: 'midnight-rhodes-loop',
  title: 'Midnight Rhodes Loop',
  description: 'Warm Rhodes chords with tape hiss and a slow vibrato.',
  bpm: 82,
  musical_key: 'F# minor',
  tags: ['melodic', 'vintage'],
  platform: 'instagram',
  embed_url: 'https://www.instagram.com/reel/CxAmpleReelId/',
  posted_at: '2026-08-20T15:00:00.000Z',
  audio_file_url: 'https://cdn.shopify.com/s/files/1/0000/0000/files/midnight-rhodes-loop.mp3',
  terms_file_url: 'https://cdn.shopify.com/s/files/1/0000/0000/files/terms-of-use.pdf',
  audio_file_name: 'Midnight Rhodes Loop.mp3',
  active: true,
  created_at: '2026-08-20T15:00:00.000Z',
  updated_at: '2026-08-20T15:00:00.000Z',
}

export const mockYouTubeComposition: Composition = {
  ...mockComposition,
  id: '00000000-0000-0000-0000-000000000002',
  slug: 'grain-choir-texture',
  title: 'Grain Choir Texture',
  description: 'Granular vocal pad bounced dry.',
  bpm: 140,
  musical_key: 'C minor',
  tags: ['ambient', 'dark'],
  platform: 'youtube',
  embed_url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
  posted_at: '2026-08-28T18:30:00.000Z',
  audio_file_url: 'https://cdn.shopify.com/s/files/1/0000/0000/files/grain-choir-texture.mp3',
}

/** What the listing actually ships to the client (no terms / file-name / flags). */
export const mockCompositionListItem: CompositionListItem = {
  id: mockComposition.id,
  slug: mockComposition.slug,
  title: mockComposition.title,
  description: mockComposition.description,
  bpm: mockComposition.bpm,
  musical_key: mockComposition.musical_key,
  tags: mockComposition.tags,
  platform: mockComposition.platform,
  embed_url: mockComposition.embed_url,
  posted_at: mockComposition.posted_at,
  audio_file_url: mockComposition.audio_file_url,
}
