import { ResolvedProductSearchParams } from "@/lib/product/normalize-search-params"

export const buildFilterKey = (params: ResolvedProductSearchParams) => {
  return params ? (
    [
      "product_page",
      `after=${params.after}`,
      `sort=${params.sort}`,
      `category=${params.category}`,
      `tags=${params.tags?.join(',')}`,
      `search=${params.search}`,
      `is_exclusive=${params.exclusive}`
    ]
  ) : ['all']
}