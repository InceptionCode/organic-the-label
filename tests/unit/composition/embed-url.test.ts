import { describe, it, expect } from 'vitest'
import { instagramEmbedSrc, youtubeIdFromUrl } from '@/lib/composition/embed-url'

// Pure URL parsing. These run on every /compositions card render to decide
// which iframe src (if any) to build from an admin-entered embed_url. A wrong
// result is either a broken embed or an unexpected value reaching an iframe src.

describe('youtubeIdFromUrl', () => {
  it('accepts a bare 11-char id', () => {
    expect(youtubeIdFromUrl('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts the id from a /shorts/ URL (ignoring query params)', () => {
    expect(youtubeIdFromUrl('https://youtube.com/shorts/pTzCk4VXCic?is=abc')).toBe('pTzCk4VXCic')
  })

  it('extracts the id from a youtu.be short link', () => {
    expect(youtubeIdFromUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts the id from a watch?v= URL', () => {
    expect(youtubeIdFromUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s')).toBe('dQw4w9WgXcQ')
  })

  it('extracts the id from an /embed/ URL', () => {
    expect(youtubeIdFromUrl('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('rejects a candidate that is not exactly 11 valid chars', () => {
    expect(youtubeIdFromUrl('https://www.youtube.com/watch?v=short')).toBeNull()
    expect(youtubeIdFromUrl('https://youtube.com/shorts/way-too-long-to-be-an-id')).toBeNull()
  })

  it('returns null for a non-URL, non-id string', () => {
    expect(youtubeIdFromUrl('not a url')).toBeNull()
    expect(youtubeIdFromUrl('')).toBeNull()
  })
})

describe('instagramEmbedSrc', () => {
  it('builds an /embed/ URL for a reel permalink', () => {
    expect(instagramEmbedSrc('https://www.instagram.com/reel/DVj2H1RkVHG/')).toBe(
      'https://www.instagram.com/reel/DVj2H1RkVHG/embed/',
    )
  })

  it('builds an /embed/ URL for a /p/ permalink and preserves the type segment', () => {
    expect(instagramEmbedSrc('https://instagram.com/p/ABc-123_/?utm_source=x')).toBe(
      'https://www.instagram.com/p/ABc-123_/embed/',
    )
  })

  it('handles a username-prefixed reel path', () => {
    expect(instagramEmbedSrc('https://www.instagram.com/youknowjuiceman/reel/DUTakrikSiM/')).toBe(
      'https://www.instagram.com/reel/DUTakrikSiM/embed/',
    )
  })

  it('rejects non-https URLs', () => {
    expect(instagramEmbedSrc('http://www.instagram.com/reel/DVj2H1RkVHG/')).toBeNull()
  })

  it('rejects a lookalike host', () => {
    expect(instagramEmbedSrc('https://instagram.com.evil.example/reel/DVj2H1RkVHG/')).toBeNull()
  })

  it('rejects an instagram URL with no post shortcode', () => {
    expect(instagramEmbedSrc('https://www.instagram.com/youknowjuiceman/')).toBeNull()
  })

  it('returns null for a javascript: URL', () => {
    expect(instagramEmbedSrc('javascript:alert(1)//instagram.com/p/x')).toBeNull()
  })

  it('returns null for a non-URL string', () => {
    expect(instagramEmbedSrc('nope')).toBeNull()
  })
})
