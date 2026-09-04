import { describe, it, expect } from 'vitest'
import { parseAudioPreviewUrls } from '@/utils/helpers/parse-preview-urls'
import { parseWhatsIncluded } from '@/utils/helpers/parse-whats-included'

// Both functions parse JSON strings and validate them through Zod schemas.
// They are called on every product render to extract metafield values from Shopify.
// All inputs are "untrusted" strings from the Shopify API — robust error handling is critical.

// ---------------------------------------------------------------------------
// parseAudioPreviewUrls
// ---------------------------------------------------------------------------

describe('parseAudioPreviewUrls', () => {
  // Missing metafield — Shopify returns null when a metafield is not set.
  it('returns [] for null input', () => {
    expect(parseAudioPreviewUrls(null)).toEqual([])
  })

  it('returns [] for undefined input', () => {
    expect(parseAudioPreviewUrls(undefined)).toEqual([])
  })

  it('returns [] for an empty string', () => {
    expect(parseAudioPreviewUrls('')).toEqual([])
  })

  // Invalid JSON must be caught and return [] without throwing.
  // Shopify metafield values can be corrupted by admin edits.
  it('returns [] for invalid JSON', () => {
    expect(parseAudioPreviewUrls('not json')).toEqual([])
  })

  // Valid JSON but wrong shape — schema validation fails, returns [].
  it('returns [] when JSON is valid but fails schema validation', () => {
    // An object is not an array — fails the array schema.
    expect(parseAudioPreviewUrls(JSON.stringify({ preview_title: 'X', preview_url: 'Y' }))).toEqual([])
  })

  it('returns [] when array items are missing required fields', () => {
    // preview_url is required by the schema.
    expect(parseAudioPreviewUrls(JSON.stringify([{ preview_title: 'Demo' }]))).toEqual([])
  })

  // The happy path — a valid serialized array from Shopify.
  it('parses a valid JSON array of preview objects', () => {
    const input = [
      { preview_title: 'Demo 1', preview_url: 'https://example.com/1.mp3' },
      { preview_title: 'Demo 2', preview_url: 'https://example.com/2.mp3' },
    ]
    expect(parseAudioPreviewUrls(JSON.stringify(input))).toEqual(input)
  })

  // An empty array is a valid schema value — no previews configured.
  it('returns an empty array for a valid empty JSON array', () => {
    expect(parseAudioPreviewUrls(JSON.stringify([]))).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// parseWhatsIncluded
// ---------------------------------------------------------------------------

describe('parseWhatsIncluded', () => {
  // Same null/empty guards as parseAudioPreviewUrls.
  it('returns [] for null input', () => {
    expect(parseWhatsIncluded(null)).toEqual([])
  })

  it('returns [] for undefined input', () => {
    expect(parseWhatsIncluded(undefined)).toEqual([])
  })

  it('returns [] for an empty string', () => {
    expect(parseWhatsIncluded('')).toEqual([])
  })

  it('returns [] for invalid JSON', () => {
    expect(parseWhatsIncluded('{broken json')).toEqual([])
  })

  // Objects missing the required `label` field fail the Zod schema.
  it('returns [] when items are missing the required label field', () => {
    expect(parseWhatsIncluded(JSON.stringify([{ icon: '🎵' }]))).toEqual([])
  })

  // Label-only items are valid — icon and description are optional.
  it('parses items with only a label (no icon or description)', () => {
    const input = [{ label: '24-bit WAV files' }]
    expect(parseWhatsIncluded(JSON.stringify(input))).toEqual(input)
  })

  // Full items with all optional fields.
  it('parses items with label, icon, and description', () => {
    const input = [
      { label: 'MIDI files', icon: '🎹', description: 'Full MIDI stems included' },
    ]
    expect(parseWhatsIncluded(JSON.stringify(input))).toEqual(input)
  })

  // Mixed items — some with icon, some without.
  it('parses an array mixing label-only and full items', () => {
    const input = [
      { label: 'WAV files' },
      { label: 'MIDI files', icon: '🎹' },
      { label: 'Stems', description: 'Separated stems' },
    ]
    expect(parseWhatsIncluded(JSON.stringify(input))).toEqual(input)
  })
})
