import { describe, expect, test } from 'bun:test'
import { RECOVERY_WINDOW_SECONDS, isRecoverySession } from '~/lib/recovery'
import { RECOVERY_COOKIE_MAX_AGE, createRecoveryCookieValue, isValidRecoveryCookie } from '~/server/identity/recovery-cookie'

const now = 1_800_000_000

describe('isRecoverySession', () => {
  test('true for a fresh recovery amr entry', () => {
    expect(isRecoverySession({ amr: [{ method: 'recovery', timestamp: now - 60 }] }, now)).toBe(true)
  })

  test('false for an ordinary password or magic link session', () => {
    expect(isRecoverySession({ amr: [{ method: 'password', timestamp: now }] }, now)).toBe(false)
    expect(isRecoverySession({ amr: [{ method: 'otp', timestamp: now }] }, now)).toBe(false)
  })

  test('false once the recovery entry is older than the window', () => {
    const stale = now - RECOVERY_WINDOW_SECONDS - 1
    expect(isRecoverySession({ amr: [{ method: 'recovery', timestamp: stale }] }, now)).toBe(false)
  })

  test('false without claims or amr', () => {
    expect(isRecoverySession(null, now)).toBe(false)
    expect(isRecoverySession({}, now)).toBe(false)
    expect(isRecoverySession({ amr: 'recovery' }, now)).toBe(false)
  })
})

describe('recovery cookie', () => {
  const secret = 'test-secret'
  const value = createRecoveryCookieValue('user-1', secret, now)

  test('valid for the same user within the window', () => {
    expect(isValidRecoveryCookie(value, 'user-1', secret, now + 60)).toBe(true)
  })

  test('rejects another user, an expired cookie, a wrong secret and tampering', () => {
    expect(isValidRecoveryCookie(value, 'user-2', secret, now)).toBe(false)
    expect(isValidRecoveryCookie(value, 'user-1', secret, now + RECOVERY_COOKIE_MAX_AGE + 1)).toBe(false)
    expect(isValidRecoveryCookie(value, 'user-1', 'other-secret', now)).toBe(false)
    const [, , mac] = value.split('.')
    expect(isValidRecoveryCookie(`user-1.${now + 99_999}.${mac}`, 'user-1', secret, now)).toBe(false)
    expect(isValidRecoveryCookie(undefined, 'user-1', secret, now)).toBe(false)
  })
})
