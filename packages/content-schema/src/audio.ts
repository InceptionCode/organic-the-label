import { z } from "zod/v4"
import { PREVIEW_BITRATE_KBPS, PREVIEW_MAX_SECONDS, PREVIEW_MIN_SECONDS } from "./limits"

export const BRAND_ARTIST = "Organic Sonics"
export const SITE_ORIGIN = "https://www.organicsonics.com"

/**
 * Tags embedded in every MP3 the admin app produces (ID3v2.3).
 * Keys map to ffmpeg `-metadata` names in `toFfmpegMetadata`.
 */
export const AudioTagsSchema = z.object({
  title: z.string().trim().min(1),
  artist: z.string().trim().min(1).default(BRAND_ARTIST),
  album: z.string().trim().min(1).optional(),
  bpm: z.number().int().positive().max(400).optional(),
  key: z.string().trim().min(1).max(24).optional(),
  genre: z.string().trim().min(1).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  copyright: z.string().trim().min(1).optional(),
  comment: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1).optional(),
})
export type AudioTags = z.infer<typeof AudioTagsSchema>
export type AudioTagsInput = z.input<typeof AudioTagsSchema>

export function copyrightLine(year: number = new Date().getFullYear()): string {
  return `© ${year} ${BRAND_ARTIST}`
}

/** Flattens tags into ffmpeg `-metadata key=value` pairs (ID3v2.3 frame names ffmpeg understands). */
export function toFfmpegMetadata(input: AudioTagsInput): Array<[string, string]> {
  const tags = AudioTagsSchema.parse(input)
  const year = tags.year ?? new Date().getFullYear()
  const pairs: Array<[string, string | undefined]> = [
    ["title", tags.title],
    ["artist", tags.artist],
    ["album_artist", tags.artist],
    ["album", tags.album],
    ["genre", tags.genre],
    ["date", String(year)],
    ["copyright", tags.copyright ?? copyrightLine(year)],
    ["comment", tags.comment],
    ["TBPM", tags.bpm ? String(tags.bpm) : undefined],
    ["TKEY", tags.key],
    ["publisher", BRAND_ARTIST],
    // Unknown keys are written by ffmpeg as TXXX user-defined frames.
    ["os_slug", tags.slug],
  ]
  return pairs.filter((pair): pair is [string, string] => Boolean(pair[1]))
}

export const PreviewSpecSchema = z
  .object({
    startSec: z.number().min(0),
    durationSec: z.number().min(PREVIEW_MIN_SECONDS).max(PREVIEW_MAX_SECONDS),
    fadeInSec: z.number().min(0).max(5).default(0.5),
    fadeOutSec: z.number().min(0).max(10).default(2),
    loudnessLufs: z.number().min(-30).max(-6).default(-14),
    bitrateKbps: z.number().int().min(96).max(320).default(PREVIEW_BITRATE_KBPS),
  })
  .refine((spec) => spec.fadeInSec + spec.fadeOutSec < spec.durationSec, {
    message: "Fades are longer than the preview",
    path: ["fadeOutSec"],
  })
export type PreviewSpec = z.infer<typeof PreviewSpecSchema>
export type PreviewSpecInput = z.input<typeof PreviewSpecSchema>

/**
 * Default preview window for a track of `totalSec` length: 30s starting 25% in,
 * clamped so the window never runs past the end.
 */
export function defaultPreviewSpec(totalSec: number): PreviewSpec {
  const durationSec = Math.max(
    PREVIEW_MIN_SECONDS,
    Math.min(PREVIEW_MAX_SECONDS, Math.floor(totalSec)),
  )
  const latestStart = Math.max(0, totalSec - durationSec)
  const startSec = Math.min(Math.round(totalSec * 0.25 * 10) / 10, latestStart)
  return PreviewSpecSchema.parse({ startSec, durationSec })
}

/** ffmpeg audio filter chain for a preview: fades + single-pass loudness normalization. */
export function previewFilterChain(spec: PreviewSpecInput): string {
  const s = PreviewSpecSchema.parse(spec)
  const fadeOutStart = Math.max(0, s.durationSec - s.fadeOutSec)
  const filters = [
    s.fadeInSec > 0 ? `afade=t=in:st=0:d=${s.fadeInSec}` : null,
    s.fadeOutSec > 0 ? `afade=t=out:st=${fadeOutStart}:d=${s.fadeOutSec}` : null,
    `loudnorm=I=${s.loudnessLufs}:TP=-1:LRA=11`,
  ]
  return filters.filter(Boolean).join(",")
}

// --------------------
// Filename parsing (BPM / key hints in producer filenames)
// --------------------

const BPM_TOKEN = /^(\d{2,3})bpm$/i
const KEY_TOKEN = /^([A-G])(#|b|♯|♭)?(major|maj|minor|min|m)?$/

export type FilenameHints = { title: string; bpm?: number; key?: string }

function normalizeKey(match: RegExpMatchArray): string {
  const accidental = match[2] ? match[2].replace("♯", "#").replace("♭", "b") : ""
  const quality = match[3]
  const note = `${match[1]}${accidental}`
  if (!quality) return note
  return `${note} ${quality.startsWith("maj") ? "major" : "minor"}`
}

/**
 * Pulls a clean title plus BPM / key hints from names like
 * "Night Drive 140bpm F#min.wav" or "night_drive_140_BPM_Cm.mp3".
 * A bare note letter only counts as a key when it is the last token,
 * so titles like "A Night Drive" keep their "A".
 */
export function parseFilenameHints(filename: string): FilenameHints {
  const base = filename.split(/[\\/]/).pop() ?? filename
  const stem = base.replace(/\.[a-z0-9]+$/i, "")

  // "140 bpm" → "140bpm" so it tokenizes as one unit.
  const tokens = stem
    .replace(/(\d{2,3})[\s_\-]+bpm/gi, "$1bpm")
    .split(/[\s_\-()[\]]+/)
    .filter(Boolean)

  let bpm: number | undefined
  let key: string | undefined
  const titleTokens: string[] = []

  tokens.forEach((token, index) => {
    const bpmMatch = token.match(BPM_TOKEN)
    if (bpmMatch && bpm === undefined) {
      const value = Number(bpmMatch[1])
      if (value >= 40 && value <= 300) {
        bpm = value
        return
      }
    }

    const keyMatch = token.match(KEY_TOKEN)
    const isLast = index === tokens.length - 1
    if (keyMatch && key === undefined && (keyMatch[2] || keyMatch[3] || isLast) && index > 0) {
      key = normalizeKey(keyMatch)
      return
    }

    titleTokens.push(token)
  })

  const title = titleTokens.join(" ").trim()
  return { title: title || stem, ...(bpm ? { bpm } : {}), ...(key ? { key } : {}) }
}
