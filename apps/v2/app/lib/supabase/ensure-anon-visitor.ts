import { createSupabaseAdminClient } from './admin'

// Ported from lib/supabase/ensure-anon-visitor.ts
// Upserts a row in anonymous_visitors, handles insert races via duplicate-key retry.
export async function ensureAnonymousVisitor(anon_token: string): Promise<{ id: string; anon_token: string }> {
  const supabase = createSupabaseAdminClient()

  const { data: existing, error: selectError } = await supabase
    .from('anonymous_visitors')
    .select('id, anon_token')
    .eq('anon_token', anon_token)
    .maybeSingle()

  if (selectError) throw new Error(`Failed to query anonymous visitor: ${selectError.message}`)

  if (existing) {
    await supabase
      .from('anonymous_visitors')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', existing.id)
    return existing
  }

  const { data: created, error: insertError } = await supabase
    .from('anonymous_visitors')
    .insert({ anon_token, first_seen_at: new Date().toISOString(), last_seen_at: new Date().toISOString() })
    .select('id, anon_token')
    .single()

  if (!insertError && created) return created

  const isDuplicate =
    insertError?.code === '23505' || insertError?.message?.toLowerCase().includes('duplicate')

  if (isDuplicate) {
    const { data: afterConflict, error: retryError } = await supabase
      .from('anonymous_visitors')
      .select('id, anon_token')
      .eq('anon_token', anon_token)
      .single()

    if (retryError || !afterConflict) {
      throw new Error(`Anonymous visitor insert raced and retry failed: ${retryError?.message ?? 'unknown'}`)
    }

    await supabase
      .from('anonymous_visitors')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', afterConflict.id)

    return afterConflict
  }

  throw new Error(`Failed to create anonymous visitor: ${insertError?.message ?? 'unknown'}`)
}
