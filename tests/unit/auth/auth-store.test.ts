import { describe, it, expect } from 'vitest'
import { createAuthStore, defaultUserState } from '@/lib/store/auth-store'

// auth-store.ts is the vanilla Zustand store for auth state.
// These tests verify the factory function and default state shape — the
// AuthStoreProvider depends on these to hydrate correctly.

describe('defaultUserState', () => {
  // defaultUserState is the fallback used when the context is not yet populated.
  // If any field is wrong, components relying on it for conditional rendering
  // (e.g., showing the Login link vs ProfileDropdown) will behave incorrectly.
  it('has is_anon: true so anonymous visitors see the correct UI', () => {
    expect(defaultUserState.is_anon).toBe(true)
  })

  it('has is_member: false so non-members see the correct gating', () => {
    expect(defaultUserState.is_member).toBe(false)
  })

  it('has empty strings for username, email, created_at, confirmed_at', () => {
    expect(defaultUserState.username).toBe('')
    expect(defaultUserState.email).toBe('')
    expect(defaultUserState.created_at).toBe('')
    expect(defaultUserState.confirmed_at).toBe('')
  })
})

describe('createAuthStore', () => {
  // createAuthStore() with no argument must use the default { user: null } init state.
  it('initialises with user: null when called with no arguments', () => {
    const store = createAuthStore()
    expect(store.getState().user).toBeNull()
  })

  // When the provider passes an initial user (e.g., from a server-side auth check),
  // the store must reflect that value immediately.
  it('initialises with the provided user when passed an initState', () => {
    const store = createAuthStore({ user: defaultUserState })
    expect(store.getState().user).toEqual(defaultUserState)
  })

  // Two stores created separately must not share state — each is independent.
  it('creates independent store instances', () => {
    const storeA = createAuthStore({ user: null })
    const storeB = createAuthStore({ user: defaultUserState })
    expect(storeA.getState().user).toBeNull()
    expect(storeB.getState().user).toEqual(defaultUserState)
  })
})
