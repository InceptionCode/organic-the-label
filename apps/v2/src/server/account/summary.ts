import type { SupabaseClient } from '@supabase/supabase-js'

export type AccountSummary = {
  email: string | null
  displayName: string | null
  /** ISO timestamp of the profile row (account creation). */
  memberSince: string | null
  emailConfirmed: boolean
}

type ProfileRow = { email: string | null; display_name: string | null; created_at: string | null }

export type SummaryFallback = { email: string | null; displayName: string | null; emailConfirmed: boolean }

/**
 * The signed-in user's profile. `client` must be the user-scoped (cookie) client so RLS
 * (`profiles_select_own`) applies. Session claims fill any gap if the profile row is missing.
 */
export async function getSummary(client: SupabaseClient, userId: string, fallback: SummaryFallback): Promise<AccountSummary> {
  const { data, error } = await client
    .from('profiles')
    .select('email, display_name, created_at')
    .eq('id', userId)
    .maybeSingle<ProfileRow>()
  if (error) throw new Error(`Failed to load profile: ${error.message}`)
  return {
    email: data?.email ?? fallback.email,
    displayName: data?.display_name ?? fallback.displayName,
    memberSince: data?.created_at ?? null,
    emailConfirmed: fallback.emailConfirmed,
  }
}
