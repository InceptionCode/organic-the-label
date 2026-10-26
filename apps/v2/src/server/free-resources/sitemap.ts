import { getCached } from '~/server/cache/redis'
import { keys, ttl } from '~/server/cache/keys'
import { createSupabaseAdminClient } from '~/server/supabase/admin'

export type FreeResourceSitemapEntry = { slug: string; updatedAt: string | null }

/**
 * Active free resources for /free/{slug} sitemap URLs. Cached under free-resources:sitemap, which
 * apps/api busts with free-resources:*. Admin client for v1 parity (pages/free.md): the anon read
 * policy is not guaranteed on every remote. Only slug and updated_at are selected.
 */
export async function getFreeResourceSitemapEntries(): Promise<FreeResourceSitemapEntry[]> {
  return getCached(keys.freeResourcesSitemap(), ttl.freeResources, async () => {
    const { data, error } = await createSupabaseAdminClient()
      .from('free_resources')
      .select('slug, updated_at')
      .eq('active', true)
      .order('slug')
    if (error) throw new Error(`free resources sitemap query failed: ${error.message}`)
    return (data ?? []).map((row: { slug: string; updated_at: string | null }) => ({
      slug: row.slug,
      updatedAt: row.updated_at ?? null,
    }))
  })
}
