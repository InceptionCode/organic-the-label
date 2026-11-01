// /auth/confirm search params. Zod-free on purpose: validateConfirmSearch is the route's validateSearch,
// which ships in the entry chunk (phase 07.6 budget). lib/auth-schemas.ts keeps the zod schema with the
// same rules for the confirmOtpFn validator.

export const otpTypes = ['email', 'signup', 'magiclink', 'recovery', 'invite', 'email_change'] as const
export type OtpType = (typeof otpTypes)[number]

export type ConfirmSearch = { token_hash?: string; type?: OtpType; next?: string }

/** All-or-nothing like the former `safeParse`: any invalid present field yields `{}`. Unknown keys are dropped. */
export function validateConfirmSearch(search: Record<string, unknown>): ConfirmSearch {
  const { token_hash, type, next } = search
  const out: ConfirmSearch = {}
  if (token_hash !== undefined) {
    if (typeof token_hash !== 'string' || token_hash.length < 1) return {}
    out.token_hash = token_hash
  }
  if (type !== undefined) {
    if (typeof type !== 'string' || !(otpTypes as readonly string[]).includes(type)) return {}
    out.type = type as OtpType
  }
  if (next !== undefined) {
    if (typeof next !== 'string') return {}
    out.next = next
  }
  return out
}
