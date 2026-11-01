import { createServerFn } from '@tanstack/react-start'
import { mapClaims } from '~/lib/map-user'
import { getOwnedProducts } from '~/server/account/owned-products'
import { getOwnedResources } from '~/server/account/owned-resources'
import { getSummary } from '~/server/account/summary'
import { claimGuestEntitlements } from '~/server/identity/merge'
import { createSupabaseServerClient } from '~/server/supabase/server'
import { tanstackCookieAdapter } from './cookies'
import { toSafeError } from './errors'
import { requireUser } from './middleware/require-user'

// Private: requireUser answers 401 without a session. Reads run on the user-scoped cookie client so
// RLS applies. The two admin-client steps (claiming email-keyed purchases, listing email-keyed free
// resources) are named services filtered by the caller's verified email only.
const userClient = () => createSupabaseServerClient(tanstackCookieAdapter())

export const getAccountSummaryFn = createServerFn({ method: 'GET' })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const session = mapClaims(context.claims)
    try {
      return await getSummary(userClient(), context.userId, {
        email: session?.email ?? null,
        displayName: session?.displayName ?? null,
        emailConfirmed: session?.emailVerified ?? false,
      })
    } catch (error) {
      throw toSafeError('account.summary', 'Could not load your account.', error)
    }
  })

export const getOwnedProductsFn = createServerFn({ method: 'GET' })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const session = mapClaims(context.claims)
    try {
      if (session?.email && session.emailVerified) {
        await claimGuestEntitlements({ userId: context.userId, email: session.email }).catch((error: unknown) =>
          console.error('[account.claim]', error instanceof Error ? error.message : error),
        )
      }
      return await getOwnedProducts(userClient(), context.userId)
    } catch (error) {
      throw toSafeError('account.ownedProducts', 'Could not load your library.', error)
    }
  })

export const getOwnedResourcesFn = createServerFn({ method: 'GET' })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const session = mapClaims(context.claims)
    if (!session?.email || !session.emailVerified) return []
    try {
      return await getOwnedResources(session.email)
    } catch (error) {
      throw toSafeError('account.ownedResources', 'Could not load your free resources.', error)
    }
  })
