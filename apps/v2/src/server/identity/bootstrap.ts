import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseAdminClient } from '~/server/supabase/admin'
import { mergeVisitor } from './merge'

export type BootstrapUserInput = {
  userId: string
  email: string | null
  emailVerified: boolean
  displayName: string | null
  anonToken: string | null | undefined
}

export async function bootstrapUser(
  input: BootstrapUserInput,
  client: SupabaseClient = createSupabaseAdminClient(),
): Promise<void> {
  const profile: Record<string, unknown> = { id: input.userId, email: input.email }
  if (input.displayName) profile.display_name = input.displayName

  const { error: profileError } = await client.from('profiles').upsert(profile, { onConflict: 'id' })
  if (profileError) throw new Error(`Failed to upsert profile: ${profileError.message}`)

  const { error: prefsError } = await client
    .from('user_preferences')
    .upsert({ user_id: input.userId }, { onConflict: 'user_id', ignoreDuplicates: true })
  if (prefsError) throw new Error(`Failed to upsert user preferences: ${prefsError.message}`)

  await mergeVisitor(
    { userId: input.userId, email: input.email, emailVerified: input.emailVerified, anonToken: input.anonToken },
    client,
  )
}
