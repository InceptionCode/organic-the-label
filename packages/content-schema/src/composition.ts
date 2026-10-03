import { z } from "zod/v4"
import { COMPOSITION_BITRATE_KBPS } from "./limits"
import { SLUG_PATTERN } from "./naming"

export const COMPOSITION_PAGE_COUNT = 24

export const unionCompositionPlatform = z.enum(["instagram", "youtube"])
export type CompositionPlatform = z.infer<typeof unionCompositionPlatform>

const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/, "Expected a hex sha256 digest")

/**
 * Describes what is inside a composition's download bundle. Stored in
 * `compositions.manifest` and validated on every write from the admin app.
 */
export const CompositionBundleManifestSchema = z.object({
  schema_version: z.literal(1),
  slug: z.string().regex(SLUG_PATTERN),
  title: z.string().min(1),
  bpm: z.number().int().positive().nullable(),
  musical_key: z.string().min(1).nullable(),
  files: z
    .array(
      z.discriminatedUnion("role", [
        z.object({
          role: z.literal("audio"),
          name: z.string().min(1),
          bytes: z.number().int().positive(),
          sha256: Sha256Schema,
          format: z.literal("mp3"),
          bitrate_kbps: z.literal(COMPOSITION_BITRATE_KBPS),
          duration_seconds: z.number().positive(),
        }),
        z.object({
          role: z.literal("terms"),
          name: z.string().min(1),
          bytes: z.number().int().positive(),
          sha256: Sha256Schema,
        }),
      ]),
    )
    .refine((files) => files.filter((f) => f.role === "audio").length === 1, "Bundle needs exactly one audio file")
    .refine((files) => files.filter((f) => f.role === "terms").length === 1, "Bundle needs exactly one terms file"),
  terms_source_url: z.url(),
  bundle_file_name: z.string().regex(/\.zip$/),
  bundle_bytes: z.number().int().positive(),
  bundle_sha256: Sha256Schema,
  built_at: z.iso.datetime(),
})
export type CompositionBundleManifest = z.infer<typeof CompositionBundleManifestSchema>

// Full row (server-only: includes the file URLs used for downloads).
export const CompositionSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  bpm: z.number().nullable().optional(),
  musical_key: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  platform: unionCompositionPlatform,
  embed_url: z.string(),
  posted_at: z.string(),
  /** Short (15–30s) MP3 played on /compositions. Null on legacy rows. */
  preview_url: z.string().nullable().optional(),
  /** Pre-built ZIP in Shopify Files; the download route redirects here. */
  bundle_url: z.string().nullable().optional(),
  bundle_bytes: z.number().nullable().optional(),
  manifest: CompositionBundleManifestSchema.nullable().optional(),
  /** Legacy: full audio zipped on the fly when bundle_url is null. */
  audio_file_url: z.string().nullable().optional(),
  terms_file_url: z.string().nullable().optional(),
  audio_file_name: z.string().nullable().optional(),
  active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type Composition = z.infer<typeof CompositionSchema>

export type CompositionListItem = Omit<
  Composition,
  | "terms_file_url"
  | "audio_file_name"
  | "active"
  | "created_at"
  | "updated_at"
  | "bundle_url"
  | "bundle_bytes"
  | "manifest"
>

/** Admin form input for creating / editing a composition's listing fields. */
export const CompositionInputSchema = z.object({
  slug: z.string().regex(SLUG_PATTERN, "Use lowercase letters, numbers and dashes"),
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(600).nullable().optional(),
  bpm: z.number().int().min(40).max(300).nullable().optional(),
  musical_key: z.string().trim().max(24).nullable().optional(),
  tags: z.array(z.string()).max(8).default([]),
  platform: unionCompositionPlatform,
  embed_url: z.url("Paste the Instagram or YouTube Short URL").refine(
    (url) => /instagram\.com|youtube\.com|youtu\.be/.test(url),
    "Must be an Instagram or YouTube URL",
  ),
  posted_at: z.iso.datetime({ offset: true }),
})
export type CompositionInput = z.infer<typeof CompositionInputSchema>
