import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mapSupabaseUser, useUser } from '@/store/auth-context'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabaseAnonUser, supabaseSignedInUser } from '@/tests/fixtures/users'
import useSafeParseUser from '@/utils/hooks/use-safe-parse-user'
import { defaultUserState } from '@/lib/store/auth-store'
import { renderHook } from '@/tests/utils/render'

/* GENERAL AUTH TESTS

- ✅ session/user mapping logic
- ✅ auth state helpers/hooks
*/

vi.mock('@/store/auth-context', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/store/auth-context')>()
  return {
    ...mod,
    useUser: vi.fn(),
  }
})


describe('mapSupabaseUser', () => {
  let supabaseUser: SupabaseUser // Supabase session user

  beforeEach(() => {
    supabaseUser = supabaseAnonUser
  })

  it('maps an anonymous Supabase user to { is_anon: true }', () => {
    const user = mapSupabaseUser(supabaseUser)

    expect(user).toEqual({
      username: supabaseUser.user_metadata?.username,
      email: '',
      created_at: supabaseUser.created_at,
      confirmed_at: supabaseUser.confirmed_at,
      is_anon: true,
      updated_at: supabaseUser.updated_at,
      last_signed_in: supabaseUser.last_sign_in_at,
      avatar_url: supabaseUser.user_metadata?.avatar_url,
      is_member: supabaseUser.user_metadata?.is_member,
    })
  })

  it('maps a confirmed Supabase user to { is_anon: false }', () => {
    supabaseUser = supabaseSignedInUser
    const user = mapSupabaseUser(supabaseUser)

    expect(user).toEqual({
      username: supabaseUser.user_metadata?.username,
      email: supabaseUser.email,
      created_at: supabaseUser.created_at,
      confirmed_at: supabaseUser.confirmed_at,
      is_anon: false,
      updated_at: supabaseUser.updated_at,
      last_signed_in: supabaseUser.last_sign_in_at,
      avatar_url: supabaseUser.user_metadata?.avatar_url,
      is_member: supabaseUser.user_metadata?.is_member,
    })
  })

  it('maps is_member correctly from user metadata', () => {
    supabaseUser = {
      ...supabaseSignedInUser,
      user_metadata: { ...supabaseSignedInUser.user_metadata, is_member: true }
    }

    const user = mapSupabaseUser(supabaseUser)

    expect(user?.is_member).toBe(true)
  })

  it('falls back to email address for missing username', () => {
    supabaseUser = {
      ...supabaseSignedInUser,
      user_metadata: { ...supabaseSignedInUser.user_metadata, username: undefined }
    }

    const user = mapSupabaseUser(supabaseUser)

    expect(user?.username).toBe(supabaseUser.email)
  })

  it('falls back to empty string for missing email and username', () => {
    supabaseUser = {
      ...supabaseSignedInUser,
      email: undefined,
      user_metadata: { ...supabaseSignedInUser.user_metadata, username: undefined }
    }

    const user = mapSupabaseUser(supabaseUser)
    expect(user?.username).toBe('')
  })


  it('preserves avatar_url when present', () => {
    supabaseUser = {
      ...supabaseSignedInUser,
      user_metadata: { ...supabaseSignedInUser.user_metadata, avatar_url: 'https://example.com/avatar.png' }
    }

    const user = mapSupabaseUser(supabaseUser)
    expect(user?.avatar_url).toBe('https://example.com/avatar.png')
  })
})

describe('useSafeParseUser', () => {
  beforeEach(() => {
    vi.mocked(useUser).mockReset()
  })

  it('returns initialUser when useUser is null', () => {
    vi.mocked(useUser).mockReturnValue(null)
    const { result } = renderHook(() => useSafeParseUser(defaultUserState))

    expect(result.current).toBe(defaultUserState)
  })

  it('returns context user when useUser is set', () => {
    const fromContext = { ...defaultUserState, username: 'testuser' }
    vi.mocked(useUser).mockReturnValue(fromContext)
    const { result } = renderHook(() => useSafeParseUser(defaultUserState))

    expect(result.current).toBe(fromContext)
  })
})