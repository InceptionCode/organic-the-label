import { z } from "zod/v4"

export const MediaAssetKindSchema = z.enum([
  "product_preview",
  "composition_preview",
  "composition_bundle",
  "free_resource_bundle",
])
export type MediaAssetKind = z.infer<typeof MediaAssetKindSchema>

export const MediaAssetStatusSchema = z.enum(["uploading", "ready", "failed"])
export type MediaAssetStatus = z.infer<typeof MediaAssetStatusSchema>

export const MediaAssetOwnerTypeSchema = z.enum(["product", "composition", "free_resource"])
export type MediaAssetOwnerType = z.infer<typeof MediaAssetOwnerTypeSchema>

export const MEDIA_ASSET_MIME: Record<MediaAssetKind, string> = {
  product_preview: "audio/mpeg",
  composition_preview: "audio/mpeg",
  composition_bundle: "application/zip",
  free_resource_bundle: "application/zip",
}

/** Row in `public.media_assets`: one per file the admin app uploads to Shopify Files. */
export const MediaAssetSchema = z.object({
  id: z.string(),
  kind: MediaAssetKindSchema,
  status: MediaAssetStatusSchema,
  shopify_file_gid: z.string().nullable(),
  url: z.string().nullable(),
  filename: z.string(),
  mime_type: z.string(),
  bytes: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  duration_seconds: z.number().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  owner_type: MediaAssetOwnerTypeSchema,
  owner_ref: z.string(),
  error: z.string().nullable().optional(),
  created_by: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})
export type MediaAsset = z.infer<typeof MediaAssetSchema>

/** Payload the admin client sends before uploading (server validates again). */
export const MediaAssetUploadRequestSchema = z.object({
  kind: MediaAssetKindSchema,
  filename: z.string().min(1).max(200).regex(/^[a-z0-9][a-z0-9\-.]*\.(mp3|zip)$/, "Unexpected filename"),
  bytes: z.number().int().positive(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  duration_seconds: z.number().positive().nullable().optional(),
  owner_type: MediaAssetOwnerTypeSchema,
  owner_ref: z.string().min(1).max(200),
  alt: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
})
export type MediaAssetUploadRequest = z.infer<typeof MediaAssetUploadRequestSchema>
