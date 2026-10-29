import { createServerFn } from '@tanstack/react-start'
import { mapClaims } from '~/lib/map-user'
import { syncNewsletterOptIn, withNewsletterState, type NewsletterSyncSession } from '~/server/preferences/newsletter-sync'
import { PREFERENCES_MESSAGES, PreferencesSchema } from '~/server/preferences/options'
import { getPreferences, updatePreferences } from '~/server/preferences/service'
import { createSupabaseServerClient } from '~/server/supabase/server'
import { tanstackCookieAdapter } from './cookies'
import { toSafeError } from './errors'
import { requireUser } from './middleware/require-user'

// Private: requireUser answers 401 without a session. Both run on the user-scoped cookie client so
// RLS applies, and the row is always keyed by the session's user id, never by input. The newsletter
// opt-in is the exception: its real state is email_contacts for the session's verified email.
const userClient = () => createSupabaseServerClient(tanstackCookieAdapter())

function syncSession(userId: string, claims: Parameters<typeof mapClaims>[0]): NewsletterSyncSession {
  const session = mapClaims(claims)
  return {
    userId,
    email: session?.email ?? null,
    emailVerified: session?.emailVerified ?? false,
    displayName: session?.displayName ?? null,
  }
}

export const getPreferencesFn = createServerFn({ method: 'GET' })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    try {
      const stored = await getPreferences(userClient(), context.userId)
      return await withNewsletterState(stored, syncSession(context.userId, context.claims))
    } catch (error) {
      throw toSafeError('preferences.get', 'Could not load your preferences.', error)
    }
  })

export const updatePreferencesFn = createServerFn({ method: 'POST' })
  .middleware([requireUser])
  .validator(PreferencesSchema)
  .handler(async ({ data, context }) => {
    const client = userClient()
    try {
      const stored = await getPreferences(client, context.userId)
      // Two-way newsletter toggle against the real (email_contacts) state. Never throws: a failure
      // comes back as a status, and the mirror stores the real outcome, not the request.
      const newsletter = await syncNewsletterOptIn(
        { wanted: data.marketingOptIn, fallback: stored.marketingOptIn },
        syncSession(context.userId, context.claims),
      )
      const preferences = await updatePreferences(client, context.userId, { ...data, marketingOptIn: newsletter.subscribed })
      return { preferences, newsletter: newsletter.status }
    } catch (error) {
      throw toSafeError('preferences.update', PREFERENCES_MESSAGES.generic, error)
    }
  })
