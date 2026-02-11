import { ResolvedProductSearchParams } from "@/lib/product/normalize-search-params"

export const buildFilterKey = (params?: ResolvedProductSearchParams) => {
  return params ? (
    [`after=${params.after}`, `sort=${params.sort}`, `filter=${params.category}`, `tags=${params.tags?.join(',')}`, `search=${params.search}`, `is_exclusive=${params.exclusive}`]
  ) : ['all']
}