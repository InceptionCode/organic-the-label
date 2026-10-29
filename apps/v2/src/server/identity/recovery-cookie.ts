import { createHmac, timingSafeEqual } from 'node:crypto'

// Proof that the current session came from a password recovery email link. Supabase does not
// reliably record 'recovery' in the session's amr claim (owner test 2026-10-28), so /auth/confirm
// sets this cookie for type=recovery. The value is `${userId}.${expiresAt}.${hmac}`, signed with a
// server secret so a signed-in user cannot forge it from devtools. Checked by the
// /login/reset-password guard and enforced by updatePasswordFn, which clears it.

export const RECOVERY_COOKIE = 'pw_recovery'
export const RECOVERY_COOKIE_MAX_AGE = 15 * 60

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(`pw_recovery:${payload}`).digest('base64url')
}

export function createRecoveryCookieValue(userId: string, secret: string, nowSeconds = Math.floor(Date.now() / 1000)): string {
  const payload = `${userId}.${nowSeconds + RECOVERY_COOKIE_MAX_AGE}`
  return `${payload}.${sign(payload, secret)}`
}

export function isValidRecoveryCookie(
  value: string | null | undefined,
  userId: string | null | undefined,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  if (!value || !userId) return false
  const parts = value.split('.')
  if (parts.length !== 3) return false
  const [cookieUser, expiresAt, mac] = parts as [string, string, string]
  if (cookieUser !== userId) return false
  const exp = Number(expiresAt)
  if (!Number.isInteger(exp) || exp < nowSeconds) return false
  const expected = Buffer.from(sign(`${cookieUser}.${expiresAt}`, secret))
  const given = Buffer.from(mac)
  return expected.length === given.length && timingSafeEqual(expected, given)
}
