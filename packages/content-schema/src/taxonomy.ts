import { z } from "zod/v4"

// Product categories map 1:1 to Shopify `productType` (lowercased).
// Tags map 1:1 to Shopify product tags (lowercased).
// Anything outside these lists makes ProductSchema.parse throw on /store,
// so the admin app only ever offers values from here.

export const PRODUCT_CATEGORIES = [
  "bank",
  "beat",
  "free",
  "kit",
  "merch",
  "pack",
  "plugin",
  "suite",
] as const

export const PRODUCT_TAGS = [
  "free",
  "ambient",
  "melodic",
  "vintage",
  "r&b",
  "hiphop",
  "trap",
  "rap",
  "dark",
  "ost",
  "opium",
  "rage",
  "digital",
] as const

export const unionCategories = z.enum(PRODUCT_CATEGORIES)
export type ProductCategories = z.infer<typeof unionCategories>

export const unionTags = z.enum(PRODUCT_TAGS)
export type ProductTags = z.infer<typeof unionTags>

export function isProductCategory(value: string): value is ProductCategories {
  return (PRODUCT_CATEGORIES as readonly string[]).includes(value)
}

export function isProductTag(value: string): value is ProductTags {
  return (PRODUCT_TAGS as readonly string[]).includes(value)
}
