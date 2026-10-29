import type { SupabaseClient } from '@supabase/supabase-js'
import { DEFAULT_PREFERENCES, knownGenres, knownProductTypes, type Preferences } from './options'

// user_preferences reads and writes. `client` must be the user-scoped (cookie) client so RLS
// (`auth.uid() = user_id` on select, insert and update) applies: a crafted user id changes nothing.

type PreferencesRow = {
  favorite_genres: string[] | null
  favorite_product_types: string[] | null
  marketing_opt_in: boolean | null
  personalization_opt_in: boolean | null
}

const COLUMNS = 'favorite_genres, favorite_product_types, marketing_opt_in, personalization_opt_in'

function fromRow(row: PreferencesRow | null): Preferences {
  if (!row) return DEFAULT_PREFERENCES
  return {
    favoriteGenres: knownGenres(row.favorite_genres),
    favoriteProductTypes: knownProductTypes(row.favorite_product_types),
    marketingOptIn: row.marketing_opt_in ?? false,
    personalizationOptIn: row.personalization_opt_in ?? false,
  }
}

/** The signed-in user's preferences, or the defaults when the signup trigger left no row. */
export async function getPreferences(client: SupabaseClient, userId: string): Promise<Preferences> {
  const { data, error } = await client
    .from('user_preferences')
    .select(COLUMNS)
    .eq('user_id', userId)
    .maybeSingle<PreferencesRow>()
  if (error) throw new Error(`Failed to load preferences: ${error.message}`)
  return fromRow(data)
}

/** Upserts on user_id (insert when the row is missing) and returns what was stored. */
export async function updatePreferences(client: SupabaseClient, userId: string, prefs: Preferences): Promise<Preferences> {
  const { data, error } = await client
    .from('user_preferences')
    .upsert(
      {
        user_id: userId,
        favorite_genres: prefs.favoriteGenres,
        favorite_product_types: prefs.favoriteProductTypes,
        marketing_opt_in: prefs.marketingOptIn,
        personalization_opt_in: prefs.personalizationOptIn,
      },
      { onConflict: 'user_id' },
    )
    .select(COLUMNS)
    .single<PreferencesRow>()
  if (error || !data) throw new Error(`Failed to save preferences: ${error?.message ?? 'no row'}`)
  return fromRow(data)
}
