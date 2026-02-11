// lib/shopify/products.cached.ts
import { unstable_cache } from "next/cache";
import { getProductsFetch } from '@/app/api/store/get-products';

import type { NormalizedSearchParams } from "../product/normalize-search-params";
import { buildFilterKey } from "../product/build-filter-tag";

/**
 * Cache key must be deterministic and only based on inputs.
 * No cookies/headers inside this function or anything it imports.
 */

export const getCachedProductsPage = (searchParams: NormalizedSearchParams, productTable: string) =>
  unstable_cache(
    async () => getProductsFetch(searchParams),
    ["shopify:productsPage", productTable, ...buildFilterKey(searchParams)],
    {
      revalidate: 900,
    }
  )();
