import type { SupabaseClient } from '@supabase/supabase-js'
import { ProductWhatsIncludedSchema, type FreeResourcePublic } from '@organic/content-schema'
import { getCached } from '~/server/cache/redis'
import { keys, ttl } from '~/server/cache/keys'
import { createSupabaseAdminClient } from '~/server/supabase/admin'

export type { FreeResourcePublic }

export const DEFAULT_FREE_RESOURCE_SLUG = 'starter-kit'

// Public columns only: download_url never reaches a page, a query, or JSON-LD.
const PUBLIC_COLUMNS = 'slug, name, description, includes'

type Lookup = { slug: string } | { featured: true }
type Deps = { client?: () => SupabaseClient }

async function fetchFreeResource(lookup: Lookup, client: () => SupabaseClient): Promise<FreeResourcePublic | null> {
  let query = client().from('free_resources').select(PUBLIC_COLUMNS).eq('active', true)
  query = 'slug' in lookup ? query.eq('slug', lookup.slug) : query.eq('featured', true)
  const { data, error } = await query.limit(1).maybeSingle()
  if (error) throw new Error(`free resource query failed: ${error.message}`)
  if (!data) return null
  const row = data as { slug: string; name: string; description: string | null; includes: unknown }
  const includes = ProductWhatsIncludedSchema.safeParse(row.includes)
  return {
    slug: row.slug,
    name: row.name,
    description: row.description ?? null,
    includes: includes.success ? includes.data : [],
  } as FreeResourcePublic
}

/**
 * Port of v1 get-free-resource.ts. Admin client inside a named service (the anon read policy is
 * not guaranteed on every remote). Found rows are cached (300s, busted by apps/api with
 * free-resources:*); null and errors are never cached, so a newly activated row shows up at once.
 */
export async function getFreeResourceBySlug(slug: string, { client = createSupabaseAdminClient }: Deps = {}) {
  return getCached(keys.freeResourceBySlug(slug), ttl.freeResource, () => fetchFreeResource({ slug }, client))
}

/** The resource shown at /free: the featured row, else the starter kit, else null (default copy). */
export async function getFeaturedFreeResource({ client = createSupabaseAdminClient }: Deps = {}) {
  return getCached(keys.freeResourceFeatured(), ttl.freeResource, async () =>
    (await fetchFreeResource({ featured: true }, client)) ?? (await fetchFreeResource({ slug: DEFAULT_FREE_RESOURCE_SLUG }, client)),
  )
}
