import { ResolvedProductSearchParams } from "@/lib/product/normalize-search-params"

export const buildFilterKey = (params?: ResolvedProductSearchParams) => {
  return params ? (
    `sort=${params.sort}|filter=${params.category}|search=${params.search}|is_exclusive=${params.exclusive}`
  ) : 'all'
}