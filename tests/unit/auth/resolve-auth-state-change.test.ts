import { describe, it, expect } from 'vitest'
import { resolveAuthStateChange, mapSupabaseUser } from '@/store/auth-context'
import { supabaseSignedInUser } from '../../fixtures/users'

const mappedSignedInUser = mapSupabaseUser(supabaseSignedInUser)

// resolveAuthStateChange is the pure decision logic AuthStoreProvider uses to
// react to onAuthStateChange events. It's the regression test for the
// reported flake: the server already seeds the store with a cookie-verified
// user (see InitAuthStore), and the browser client's first callback
// (INITIAL_SESSION) must not clobber that value while it catches up — that
// clobbering is what produced the multi-second "Login" flash after a full
// navigation.
describe('resolveAuthStateChange', () => {
  it('skips the first INITIAL_SESSION event so it does not clobber a server-seeded user', () => {
    const decision = resolveAuthStateChange('INITIAL_SESSION', null, true)
    expect(decision).toEqual({ type: 'skip' })
  })

  it('skips an INITIAL_SESSION event carrying a session too, as the first event', () => {
    const decision = resolveAuthStateChange('INITIAL_SESSION', { user: supabaseSignedInUser }, true)
    expect(decision).toEqual({ type: 'skip' })
  })

  it('applies a SIGNED_IN event even as the first event received', () => {
    const decision = resolveAuthStateChange('SIGNED_IN', { user: supabaseSignedInUser }, true)
    expect(decision).toEqual({ type: 'update', user: mappedSignedInUser })
  })

  it('applies a SIGNED_OUT event even as the first event received', () => {
    const decision = resolveAuthStateChange('SIGNED_OUT', null, true)
    expect(decision).toEqual({ type: 'update', user: null })
  })

  it('applies an INITIAL_SESSION event once it is no longer the first event', () => {
    const decision = resolveAuthStateChange('INITIAL_SESSION', { user: supabaseSignedInUser }, false)
    expect(decision).toEqual({ type: 'update', user: mappedSignedInUser })
  })

  it('applies a later SIGNED_IN event after an earlier INITIAL_SESSION was skipped', () => {
    const first = resolveAuthStateChange('INITIAL_SESSION', null, true)
    expect(first).toEqual({ type: 'skip' })

    const second = resolveAuthStateChange('SIGNED_IN', { user: supabaseSignedInUser }, false)
    expect(second).toEqual({ type: 'update', user: mappedSignedInUser })
  })
})
