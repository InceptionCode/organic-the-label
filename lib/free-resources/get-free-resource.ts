import { unstable_cache } from 'next/cache';
import { createSupabaseAdminClient } from '@/utils/supabase/base';
import { ProductWhatsIncludedSchema, type FreeResourcePublic } from '@/lib/schemas';

const TAG = '[getFreeResource]';
export const FREE_RESOURCES_CACHE_TAG = 'free-resources';
export const DEFAULT_FREE_RESOURCE_SLUG = 'starter-kit';

// Public columns only: download_url never reaches the page.
const PUBLIC_COLUMNS = 'slug, name, description, includes';

type Lookup = { slug: string } | { featured: true };

async function fetchFreeResource(lookup: Lookup): Promise<FreeResourcePublic | null> {
  const supabase = createSupabaseAdminClient();
  let query = supabase.from('free_resources').select(PUBLIC_COLUMNS).eq('active', true);
  query = 'slug' in lookup ? query.eq('slug', lookup.slug) : query.eq('featured', true);

  const { data, error } = await query.limit(1).maybeSingle();
  if (error) {
    console.error(`${TAG} supabase error`, { lookup, error: error.message });
    return null;
  }
  if (!data) return null;

  const includes = ProductWhatsIncludedSchema.safeParse(data.includes);
  return {
    slug: data.slug,
    name: data.name,
    description: data.description,
    includes: includes.success ? includes.data : [],
  };
}

export const getCachedFreeResource = (slug: string) =>
  unstable_cache(() => fetchFreeResource({ slug }), ['free-resources:by-slug:v1', slug], {
    revalidate: 300,
    tags: [FREE_RESOURCES_CACHE_TAG],
  })();

/** The resource shown at /free: the featured row, else the starter kit. */
export const getCachedFeaturedFreeResource = () =>
  unstable_cache(
    async () =>
      (await fetchFreeResource({ featured: true })) ??
      (await fetchFreeResource({ slug: DEFAULT_FREE_RESOURCE_SLUG })),
    ['free-resources:featured:v1'],
    { revalidate: 300, tags: [FREE_RESOURCES_CACHE_TAG] },
  )();
