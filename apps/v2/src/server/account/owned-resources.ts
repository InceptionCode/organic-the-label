import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseAdminClient } from '~/server/supabase/admin'

export type OwnedResource = {
  slug: string
  name: string
  description: string | null
  requestedAt: string
  /** resource_downloads id: the same capability the request email links to (/free/download/{id}). */
  downloadId: string
}

type Row = {
  id: string
  created_at: string
  free_resources: { slug: string; name: string; description: string | null; active: boolean } | null
}

/**
 * Free resources requested with the user's verified email, newest request per resource. email_contacts
 * and resource_downloads have no user-facing RLS policy, so this named service uses the admin client
 * and only ever filters by the caller's verified email (owner request 2026-10-28: the library shows
 * owned products and resources).
 */
export async function getOwnedResources(
  email: string,
  client: SupabaseClient = createSupabaseAdminClient(),
): Promise<OwnedResource[]> {
  const { data: contact, error: contactError } = await client
    .from('email_contacts')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()
  if (contactError) throw new Error(`Failed to load contact: ${contactError.message}`)
  if (!contact) return []

  const { data, error } = await client
    .from('resource_downloads')
    .select('id, created_at, free_resources ( slug, name, description, active )')
    .eq('contact_id', (contact as { id: string }).id)
    .order('created_at', { ascending: false })
  if (error) throw new Error(`Failed to load resource downloads: ${error.message}`)

  const seen = new Set<string>()
  const out: OwnedResource[] = []
  for (const row of (data ?? []) as unknown as Row[]) {
    const r = row.free_resources
    if (!r?.active || seen.has(r.slug)) continue
    seen.add(r.slug)
    out.push({ slug: r.slug, name: r.name, description: r.description, requestedAt: row.created_at, downloadId: row.id })
  }
  return out
}
