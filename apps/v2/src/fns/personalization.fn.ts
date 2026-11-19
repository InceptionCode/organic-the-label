import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { mapClaims } from '~/lib/map-user'
import { RECOMMENDATION_LIMIT, RECOMMENDATION_SLOTS } from '~/lib/recommendation-slots'
import { claimGuestEntitlements } from '~/server/identity/merge'
import { getRecommendations } from '~/server/personalization/recommendations'
import { createSupabaseServerClient } from '~/server/supabase/server'
import { tanstackCookieAdapter } from './cookies'
import { requireUser } from './middleware/require-user'

export const getRecommendationsFn = createServerFn({ method: 'GET' })
  .middleware([requireUser])
  .validator(z.object({ slot: z.enum(RECOMMENDATION_SLOTS) }))
  .handler(async ({ data, context }) => {
    const session = mapClaims(context.claims)
    const email = session?.emailVerified ? session.email : null
    return getRecommendations(
      { userId: context.userId, slot: data.slot, limit: RECOMMENDATION_LIMIT },
      {
        client: createSupabaseServerClient(tanstackCookieAdapter()),
        claimEntitlements: email ? () => claimGuestEntitlements({ userId: context.userId, email }) : undefined,
      },
    )
  })
