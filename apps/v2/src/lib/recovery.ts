// A session counts as a password-recovery session only when it was created by the recovery email
// link (an amr entry with method 'recovery') within the last hour, the default email OTP lifetime.
// An ordinary signed-in session never reaches the set-new-password form (decided 2026-10-27).
export const RECOVERY_WINDOW_SECONDS = 60 * 60

type AmrEntry = { method: string; timestamp: number }
type ClaimsWithAmr = { amr?: unknown } | null | undefined

export function isRecoverySession(claims: ClaimsWithAmr, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  if (!claims || !Array.isArray(claims.amr)) return false
  return (claims.amr as AmrEntry[]).some(
    (entry) =>
      entry?.method === 'recovery' &&
      typeof entry.timestamp === 'number' &&
      nowSeconds - entry.timestamp <= RECOVERY_WINDOW_SECONDS,
  )
}
