import { z } from "zod/v4"
import { isProductCategory, isProductTag } from "./taxonomy"

// --------------------
// Shopify product metafields (namespace "custom")
// --------------------

export const METAFIELD_AUDIO_PREVIEW_URLS = { namespace: "custom", key: "audio_preview_urls" } as const
export const METAFIELD_WHATS_INCLUDED = { namespace: "custom", key: "whats_included" } as const

export const ProductPreviewUrlsSchema = z.array(z.object({ preview_title: z.string(), preview_url: z.string() }))
export type ProductPreviewUrls = z.infer<typeof ProductPreviewUrlsSchema>

export const ProductWhatsIncludedSchema = z.array(
  z.object({ icon: z.string().optional(), label: z.string(), description: z.string().optional() }),
)
export type ProductWhatsIncluded = z.infer<typeof ProductWhatsIncludedSchema>

// Stricter shapes used when *writing* metafields from the admin app. The read
// schemas above stay lenient so older products keep rendering.
const PreviewEntryInputSchema = z.object({
  preview_title: z.string().trim().min(1, "Preview title is required"),
  preview_url: z.url("Preview URL must be a valid URL").refine(
    (url) => url.startsWith("https://cdn.shopify.com/"),
    "Preview URL must be a Shopify Files CDN URL",
  ),
})

const WhatsIncludedEntryInputSchema = z.object({
  icon: z.string().trim().min(1).optional(),
  label: z.string().trim().min(1, "Label is required"),
  description: z.string().trim().min(1).optional(),
})

export type MetafieldBuildResult =
  | { ok: true; value: string }
  | { ok: false; errors: string[] }

function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length ? `[${issue.path.join(".")}] ` : ""
    return `${path}${issue.message}`
  })
}

/** Builds the JSON string pasted into Shopify's `custom.audio_preview_urls` metafield. */
export function buildAudioPreviewUrlsMetafield(entries: unknown): MetafieldBuildResult {
  const parsed = z.array(PreviewEntryInputSchema).min(1, "Add at least one preview").safeParse(entries)
  if (!parsed.success) return { ok: false, errors: formatIssues(parsed.error) }
  return { ok: true, value: JSON.stringify(parsed.data, null, 2) }
}

/** Builds the JSON string pasted into Shopify's `custom.whats_included` metafield. */
export function buildWhatsIncludedMetafield(entries: unknown): MetafieldBuildResult {
  const parsed = z.array(WhatsIncludedEntryInputSchema).min(1, "Add at least one item").safeParse(entries)
  if (!parsed.success) return { ok: false, errors: formatIssues(parsed.error) }
  const cleaned = parsed.data.map(({ icon, label, description }) => ({
    ...(icon ? { icon } : {}),
    label,
    ...(description ? { description } : {}),
  }))
  return { ok: true, value: JSON.stringify(cleaned, null, 2) }
}

// --------------------
// Product lint: flags anything that would make /store fail to parse
// --------------------

export type ProductLintInput = {
  id: string
  title: string
  handle?: string
  productType: string
  tags: string[]
  audioPreviewUrls?: string | null
  whatsIncluded?: string | null
}

export type ProductLintIssue = {
  field: "productType" | "tags" | "audio_preview_urls" | "whats_included"
  message: string
  severity: "error" | "warning"
}

function lintJsonMetafield(
  raw: string | null | undefined,
  schema: z.ZodType,
  field: ProductLintIssue["field"],
): ProductLintIssue[] {
  if (!raw) return []
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return [{ field, severity: "error", message: "Metafield is not valid JSON" }]
  }
  const parsed = schema.safeParse(json)
  return parsed.success
    ? []
    : [{ field, severity: "error", message: formatIssues(parsed.error).join("; ") }]
}

export function lintProduct(product: ProductLintInput): ProductLintIssue[] {
  const issues: ProductLintIssue[] = []
  const type = product.productType.trim().toLowerCase()

  if (!type) {
    issues.push({ field: "productType", severity: "error", message: "Product type is empty" })
  } else if (!isProductCategory(type)) {
    issues.push({
      field: "productType",
      severity: "error",
      message: `Product type "${product.productType}" is not an allowed category`,
    })
  }

  for (const tag of product.tags) {
    const normalized = tag.trim().toLowerCase()
    if (!isProductTag(normalized)) {
      issues.push({ field: "tags", severity: "error", message: `Tag "${tag}" is not an allowed tag` })
    }
  }

  issues.push(...lintJsonMetafield(product.audioPreviewUrls, ProductPreviewUrlsSchema, "audio_preview_urls"))
  issues.push(...lintJsonMetafield(product.whatsIncluded, ProductWhatsIncludedSchema, "whats_included"))

  if (!product.audioPreviewUrls && type !== "merch") {
    issues.push({ field: "audio_preview_urls", severity: "warning", message: "No audio previews set" })
  }

  return issues
}
