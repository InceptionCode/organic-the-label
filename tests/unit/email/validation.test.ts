import { describe, it, expect } from 'vitest'
import {
  SubscribePayloadSchema,
  ResourceRequestPayloadSchema,
} from '@/lib/validation/email'
import { SupportPayloadSchema, SupportCategories } from '@/lib/validation/support'

// ─── SubscribePayloadSchema ───────────────────────────────────────────────────

describe('SubscribePayloadSchema', () => {
  it('passes with a valid payload', () => {
    const result = SubscribePayloadSchema.safeParse({
      email: 'user@example.com',
      marketingOptIn: true,
    })
    expect(result.success).toBe(true)
  })

  it('passes with all optional fields present', () => {
    const result = SubscribePayloadSchema.safeParse({
      email: 'user@example.com',
      firstName: 'Jay',
      source: 'footer',
      marketingOptIn: false,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.source).toBe('footer')
      expect(result.data.firstName).toBe('Jay')
    }
  })

  it('rejects an invalid email address', () => {
    const result = SubscribePayloadSchema.safeParse({
      email: 'not-an-email',
      marketingOptIn: true,
    })
    expect(result.success).toBe(false)
  })

  it('rejects a missing email', () => {
    const result = SubscribePayloadSchema.safeParse({ marketingOptIn: true })
    expect(result.success).toBe(false)
  })

  it('rejects an unknown source value', () => {
    const result = SubscribePayloadSchema.safeParse({
      email: 'user@example.com',
      source: 'invalid_source',
      marketingOptIn: true,
    })
    expect(result.success).toBe(false)
  })

  it('accepts all valid source enum values', () => {
    const sources = ['footer', 'newsletter_page', 'popup', 'checkout'] as const
    for (const source of sources) {
      const result = SubscribePayloadSchema.safeParse({
        email: 'user@example.com',
        source,
        marketingOptIn: true,
      })
      expect(result.success, `source "${source}" should be valid`).toBe(true)
    }
  })

  it('treats firstName as optional — passes without it', () => {
    const result = SubscribePayloadSchema.safeParse({
      email: 'user@example.com',
      marketingOptIn: false,
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.firstName).toBeUndefined()
  })
})

// ─── ResourceRequestPayloadSchema ────────────────────────────────────────────

describe('ResourceRequestPayloadSchema', () => {
  it('passes with a valid payload', () => {
    const result = ResourceRequestPayloadSchema.safeParse({
      email: 'user@example.com',
      resourceSlug: 'starter-kit',
      marketingOptIn: true,
    })
    expect(result.success).toBe(true)
  })

  it('rejects an empty resourceSlug', () => {
    const result = ResourceRequestPayloadSchema.safeParse({
      email: 'user@example.com',
      resourceSlug: '',
      marketingOptIn: false,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i)
    }
  })

  it('rejects a missing email', () => {
    const result = ResourceRequestPayloadSchema.safeParse({
      resourceSlug: 'starter-kit',
      marketingOptIn: false,
    })
    expect(result.success).toBe(false)
  })

  it('accepts an optional firstName', () => {
    const withName = ResourceRequestPayloadSchema.safeParse({
      email: 'user@example.com',
      firstName: 'Darrell',
      resourceSlug: 'starter-kit',
      marketingOptIn: true,
    })
    expect(withName.success).toBe(true)
    if (withName.success) expect(withName.data.firstName).toBe('Darrell')
  })
})

// ─── SupportPayloadSchema ─────────────────────────────────────────────────────

describe('SupportPayloadSchema', () => {
  const valid = {
    name: 'Darrell Washington',
    email: 'darrell@example.com',
    category: 'general' as const,
    message: 'This is a test message that is long enough.',
  }

  it('passes with a minimal valid payload', () => {
    const result = SupportPayloadSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('defaults category to "general" when omitted', () => {
    const rest = { name: valid.name, email: valid.email, message: valid.message }
    const result = SupportPayloadSchema.safeParse(rest)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.category).toBe('general')
  })

  it('defaults marketingOptIn to false when omitted', () => {
    const result = SupportPayloadSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.marketingOptIn).toBe(false)
  })

  it('rejects an empty name', () => {
    const result = SupportPayloadSchema.safeParse({ ...valid, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects a message shorter than 10 characters', () => {
    const result = SupportPayloadSchema.safeParse({ ...valid, message: 'Too short' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/10 characters/i)
    }
  })

  it('rejects an invalid category', () => {
    const result = SupportPayloadSchema.safeParse({ ...valid, category: 'refund' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid SupportCategories', () => {
    for (const category of SupportCategories) {
      const result = SupportPayloadSchema.safeParse({ ...valid, category })
      expect(result.success, `category "${category}" should be valid`).toBe(true)
    }
  })

  it('accepts an optional subject', () => {
    const result = SupportPayloadSchema.safeParse({ ...valid, subject: 'Order #1234' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.subject).toBe('Order #1234')
  })

  it('passes without subject', () => {
    const result = SupportPayloadSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.subject).toBeUndefined()
  })
})
