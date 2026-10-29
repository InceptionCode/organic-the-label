import { describe, expect, test } from 'bun:test'
import { confirmSearchSchema } from '~/lib/auth-schemas'
import { validateConfirmSearch } from '~/lib/confirm-search'

// validateConfirmSearch replaced `confirmSearchSchema.safeParse(search)` in the route (zod-free entry
// chunk); it must agree with the schema the confirmOtpFn validator still uses.
const viaSchema = (search: Record<string, unknown>) => {
  const parsed = confirmSearchSchema.safeParse(search)
  return parsed.success ? parsed.data : {}
}

describe('validateConfirmSearch', () => {
  const cases: Record<string, unknown>[] = [
    {},
    { token_hash: 'abc', type: 'magiclink' },
    { token_hash: 'abc', type: 'recovery', next: '/explore' },
    { token_hash: 'abc', type: 'magiclink', extra: 'dropped' },
    { token_hash: '', type: 'magiclink' },
    { token_hash: 'abc', type: 'bogus' },
    { token_hash: 123, type: 'signup' },
    { type: 'email', next: 42 },
    { next: '/store' },
  ]
  for (const search of cases) {
    test(JSON.stringify(search), () => {
      expect(validateConfirmSearch(search)).toEqual(viaSchema(search))
    })
  }
})
