import { z } from "zod/v4"
import { SLUG_PATTERN } from "./naming"
import { ProductWhatsIncludedSchema } from "./product"

export const FreeResourceHostingSchema = z.enum(["shopify", "external"])
export type FreeResourceHosting = z.infer<typeof FreeResourceHostingSchema>

export const FreeResourceSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  download_url: z.string(),
  hosting: FreeResourceHostingSchema.default("external"),
  includes: ProductWhatsIncludedSchema.default([]),
  mailerlite_group_id: z.string().nullable().optional(),
  bundle_bytes: z.number().nullable().optional(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})
export type FreeResource = z.infer<typeof FreeResourceSchema>

/** Fields the public /free/[slug] page renders (no download URL). */
export type FreeResourcePublic = Pick<FreeResource, "slug" | "name" | "description" | "includes">

export const FreeResourceInputSchema = z.object({
  slug: z.string().regex(SLUG_PATTERN, "Use lowercase letters, numbers and dashes"),
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(600).nullable().optional(),
  hosting: FreeResourceHostingSchema,
  download_url: z.url("Enter a valid download URL"),
  includes: ProductWhatsIncludedSchema.default([]),
  mailerlite_group_id: z.string().trim().min(1).nullable().optional(),
  bundle_bytes: z.number().int().positive().nullable().optional(),
  featured: z.boolean().default(false),
  active: z.boolean().default(false),
})
export type FreeResourceInput = z.infer<typeof FreeResourceInputSchema>
