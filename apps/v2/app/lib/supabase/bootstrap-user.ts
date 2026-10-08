import { createSupabaseAdminClient } from './admin'
import { mergeAnonymousVisitorIntoUser } from './migrate-anon-user'

type BootstrapParams = {
  userId: string
  email?: string | null
  emailVerified?: boolean
  displayName?: string | null
}

// Ported from lib/supabase/boostrap-authenticate-user.ts
// Called after every successful sign-in or OTP confirmation.
// Upserts profiles + user_preferences, then merges any anon activity.
export async function bootstrapAuthenticatedUser({
  userId,
  email,
  emailVerified,
  displayName,
}: BootstrapParams): Promise<void> {
  const supabase = createSupabaseAdminClient()

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: userId, email: email ?? null, display_name: displayName ?? null }, { onConflict: 'id' })

  if (profileError) throw new Error(`Failed to upsert profile: ${profileError.message}`)

  const { error: prefError } = await supabase
    .from('user_preferences')
    .upsert({ user_id: userId }, { onConflict: 'user_id' })

  if (prefError) throw new Error(`Failed to upsert user preferences: ${prefError.message}`)

  await mergeAnonymousVisitorIntoUser({ userId, email, emailVerified })
}
