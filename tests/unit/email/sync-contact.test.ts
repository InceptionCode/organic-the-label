import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoist mocks so factories can reference them ──────────────────────────────
// vi.mock factories are hoisted above const declarations, so we use vi.hoisted()
// to ensure these exist by the time each factory runs.

const {
  mockSingle,
  mockSelect,
  mockUpsert,
  mockInsert,
  mockUpdate,
  mockFrom,
  mockUpsertMailerLiteSubscriber,
} = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockSelect = vi.fn(() => ({ single: mockSingle }))
  const mockUpsert = vi.fn(() => ({ select: mockSelect }))
  const mockInsert = vi.fn(() => ({ select: mockSelect }))
  const mockUpdate = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }))
  const mockFrom = vi.fn(() => ({ upsert: mockUpsert, insert: mockInsert, update: mockUpdate }))
  const mockUpsertMailerLiteSubscriber = vi.fn()
  return { mockSingle, mockSelect, mockUpsert, mockInsert, mockUpdate, mockFrom, mockUpsertMailerLiteSubscriber }
})

// ─── Supabase admin client mock ───────────────────────────────────────────────

vi.mock('@/utils/supabase/base', () => ({
  createSupabaseAdminClient: () => ({ from: mockFrom }),
}))

// ─── MailerLite mock ──────────────────────────────────────────────────────────

vi.mock('@/lib/email/mailerlite', () => ({
  upsertMailerLiteSubscriber: mockUpsertMailerLiteSubscriber,
}))

import {
  syncContactToSupabase,
  syncContactToMailerLite,
  logContactEvent,
} from '@/lib/email/sync-contact'

// ─── helpers ──────────────────────────────────────────────────────────────────

function setupUpsertSuccess(contact = { id: 'contact-uuid-1', mailerlite_subscriber_id: null }) {
  mockSingle.mockResolvedValue({ data: contact, error: null })
}

function setupUpsertError(message: string) {
  mockSingle.mockResolvedValue({ data: null, error: { message } })
}

beforeEach(() => {
  vi.clearAllMocks()
  // Default: upsert returns a contact row
  setupUpsertSuccess()
  // Default: tag upsert succeeds
  mockUpsert.mockReturnValue({ select: mockSelect })
  // Default: MailerLite returns a subscriber
  mockUpsertMailerLiteSubscriber.mockResolvedValue({ id: 'ml-subscriber-123' })
})

// ─── syncContactToSupabase ────────────────────────────────────────────────────

describe('syncContactToSupabase', () => {
  it('returns the contact record on success', async () => {
    const contact = await syncContactToSupabase({ email: 'user@example.com' })
    expect(contact).toEqual({ id: 'contact-uuid-1', mailerlite_subscriber_id: null })
  })

  it('calls supabase.from("email_contacts").upsert with lowercased email', async () => {
    await syncContactToSupabase({ email: 'USER@Example.COM' })
    expect(mockFrom).toHaveBeenCalledWith('email_contacts')
    const upsertArg = (mockUpsert.mock.calls as unknown as Record<string, unknown>[][])[0]![0]!
    expect(upsertArg.email).toBe('user@example.com')
  })

  it('includes firstName as first_name when provided', async () => {
    await syncContactToSupabase({ email: 'user@example.com', firstName: 'Jay' })
    const upsertArg = (mockUpsert.mock.calls as unknown as Record<string, unknown>[][])[0]![0]!
    expect(upsertArg.first_name).toBe('Jay')
  })

  it('sets first_name to null when firstName is omitted', async () => {
    await syncContactToSupabase({ email: 'user@example.com' })
    const upsertArg = (mockUpsert.mock.calls as unknown as Record<string, unknown>[][])[0]![0]!
    expect(upsertArg.first_name).toBeNull()
  })

  it('defaults source to "website" when not provided', async () => {
    await syncContactToSupabase({ email: 'user@example.com' })
    const upsertArg = (mockUpsert.mock.calls as unknown as Record<string, unknown>[][])[0]![0]!
    expect(upsertArg.source).toBe('website')
  })

  it('upserts tags when tags array is provided', async () => {
    // Subsequent upsert calls (for tags) also need the chain mock
    const tagUpsertMock = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockImplementation(((table: string) => {
      if (table === 'email_contact_tags') return { upsert: tagUpsertMock }
      return { upsert: mockUpsert, insert: mockInsert, update: mockUpdate }
    }) as unknown as typeof mockFrom)

    await syncContactToSupabase({
      email: 'user@example.com',
      tags: ['newsletter', 'free_resource'],
    })

    expect(mockFrom).toHaveBeenCalledWith('email_contact_tags')
    const tagRows = tagUpsertMock.mock.calls[0][0]
    expect(tagRows).toHaveLength(2)
    expect(tagRows[0]).toMatchObject({ tag: 'newsletter' })
    expect(tagRows[1]).toMatchObject({ tag: 'free_resource' })
  })

  it('throws when Supabase upsert returns an error', async () => {
    setupUpsertError('duplicate key violation')
    await expect(syncContactToSupabase({ email: 'user@example.com' })).rejects.toThrow(
      'Supabase upsert error: duplicate key violation'
    )
  })

  it('throws when Supabase returns no data', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null })
    await expect(syncContactToSupabase({ email: 'user@example.com' })).rejects.toThrow(
      'no data returned'
    )
  })
})

// ─── syncContactToMailerLite ──────────────────────────────────────────────────

describe('syncContactToMailerLite', () => {
  it('calls upsertMailerLiteSubscriber with email and groupIds', async () => {
    await syncContactToMailerLite({
      email: 'user@example.com',
      supabaseContactId: 'contact-uuid-1',
      groupIds: ['grp-1'],
    })

    expect(mockUpsertMailerLiteSubscriber).toHaveBeenCalledOnce()
    const arg = mockUpsertMailerLiteSubscriber.mock.calls[0][0]
    expect(arg.email).toBe('user@example.com')
    expect(arg.groupIds).toEqual(['grp-1'])
  })

  it('stores the MailerLite subscriber id back in Supabase', async () => {
    const updateEqMock = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn().mockReturnValue({ eq: updateEqMock })
    mockFrom.mockReturnValue({ upsert: mockUpsert, insert: mockInsert, update: updateMock })

    await syncContactToMailerLite({
      email: 'user@example.com',
      supabaseContactId: 'contact-uuid-1',
    })

    expect(updateMock).toHaveBeenCalledWith({ mailerlite_subscriber_id: 'ml-subscriber-123' })
    expect(updateEqMock).toHaveBeenCalledWith('id', 'contact-uuid-1')
  })

  it('returns null when MailerLite returns no subscriber', async () => {
    mockUpsertMailerLiteSubscriber.mockResolvedValue(null)

    const result = await syncContactToMailerLite({
      email: 'user@example.com',
      supabaseContactId: 'contact-uuid-1',
    })

    expect(result).toBeNull()
  })

  it('returns the subscriber object on success', async () => {
    const result = await syncContactToMailerLite({
      email: 'user@example.com',
      supabaseContactId: 'contact-uuid-1',
    })

    expect(result).toEqual({ id: 'ml-subscriber-123' })
  })
})

// ─── logContactEvent ──────────────────────────────────────────────────────────

describe('logContactEvent', () => {
  it('inserts a row into email_contact_events', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: insertMock } as unknown as ReturnType<typeof mockFrom>)

    await logContactEvent({
      contactId: 'contact-uuid-1',
      eventType: 'subscribed',
    })

    expect(mockFrom).toHaveBeenCalledWith('email_contact_events')
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        contact_id: 'contact-uuid-1',
        event_type: 'subscribed',
      })
    )
  })

  it('includes provider and providerEventId when provided', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: insertMock } as unknown as ReturnType<typeof mockFrom>)

    await logContactEvent({
      contactId: 'contact-uuid-1',
      eventType: 'mailerlite_synced',
      provider: 'mailerlite',
      providerEventId: 'ml-event-999',
    })

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'mailerlite',
        provider_event_id: 'ml-event-999',
      })
    )
  })

  it('does not throw when Supabase insert fails — only warns', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const insertMock = vi.fn().mockResolvedValue({ error: { message: 'db error' } })
    mockFrom.mockReturnValue({ insert: insertMock } as unknown as ReturnType<typeof mockFrom>)

    await expect(
      logContactEvent({ contactId: 'contact-uuid-1', eventType: 'subscribed' })
    ).resolves.not.toThrow()

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[logContactEvent]'),
      expect.any(String)
    )
    consoleSpy.mockRestore()
  })

  it('defaults metadata to empty object when not provided', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: insertMock } as unknown as ReturnType<typeof mockFrom>)

    await logContactEvent({ contactId: 'c-1', eventType: 'test' })

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: {} })
    )
  })
})
