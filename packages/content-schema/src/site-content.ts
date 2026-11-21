import { z } from "zod/v4"

/** Rows in `public.site_content`. Fixed slots, not a CMS: a new slot needs a code change on both sides. */
export const SITE_CONTENT_KEYS = {
  placements: "work_with_me_placements",
  muso: "work_with_me_muso",
} as const

export const SiteContentKeySchema = z.enum([SITE_CONTENT_KEYS.placements, SITE_CONTENT_KEYS.muso])
export type SiteContentKey = z.infer<typeof SiteContentKeySchema>

export const MAX_PLACEMENTS = 12

const SPOTIFY_TRACK_URL = /^https:\/\/open\.spotify\.com\/(?:intl-[a-z-]+\/)?track\/[A-Za-z0-9]+\/?(?:\?.*)?$/

export const PlacementSchema = z.object({
  artist: z.string().trim().min(1, "Add the artist").max(120),
  track: z.string().trim().min(1, "Add the track").max(160),
  role: z.string().trim().min(1, "Add your role").max(120),
  /** Spotify track URL. Cover art comes from it; without one the card shows the music icon. */
  href: z.string().trim().regex(SPOTIFY_TRACK_URL, "Use a Spotify track link").optional(),
})
export type Placement = z.infer<typeof PlacementSchema>

export const PlacementListSchema = z
  .array(PlacementSchema)
  .min(1, "Keep at least one placement")
  .max(MAX_PLACEMENTS, `Use ${MAX_PLACEMENTS} placements or fewer`)

const isShopifyCdnUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === "https:" && url.hostname === "cdn.shopify.com"
  } catch {
    return false
  }
}

export const MusoScreenshotSchema = z.object({
  url: z.string().refine(isShopifyCdnUrl, "Upload the screenshot to Shopify Files first"),
})
export type MusoScreenshot = z.infer<typeof MusoScreenshotSchema>
