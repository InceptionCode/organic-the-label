import { getCached } from '~/server/cache/redis'
import { keys, ttl } from '~/server/cache/keys'
import { createSupabasePublicClient } from '~/server/supabase/server'

/**
 * Newest posted_at across active compositions: the <lastmod> of the single /compositions sitemap
 * URL (loops are #slug anchors, no per-loop URLs). Cached under compositions:sitemap, which
 * apps/api busts with compositions:*. The anon client is enough (RLS compositions_public_read).
 */
export async function getCompositionsLastmod(): Promise<string | null> {
  return getCached(keys.compositionsSitemap(), ttl.compositions, async () => {
    const { data, error } = await createSupabasePublicClient()
      .from('compositions')
      .select('posted_at')
      .eq('active', true)
      .order('posted_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw new Error(`compositions lastmod query failed: ${error.message}`)
    return (data?.posted_at as string | undefined) ?? null
  })
}
