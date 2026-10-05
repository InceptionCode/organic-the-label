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
// Filename parsing (title, BPM, key and credits in producer filenames)
// --------------------

export type FilenameHints = { title: string; bpm?: number; key?: string; credits?: string[] }

const BPM_MIN = 40
const BPM_MAX = 300
/** A number with no "bpm" next to it only counts inside brackets or before a comma. */
const BARE_BPM_MIN = 60
const BARE_BPM_MAX = 200

const BPM_WITH_UNIT = /^(?:(\d{2,3})bpm|bpm(\d{2,3}))$/i
const BARE_NUMBER = /^\d{2,3}$/
const KEY_TOKEN = /^([a-g])(#|♯|♭|b)?(major|maj|minor|min|m)?$/i
const NOTE_ONLY = /^([a-g])(#|♯|♭|b)?$/i
const QUALITY_WORD = /^(major|maj|minor|min)$/i
/** Words that join or introduce credits ("@a x @b", "feat. @a", "prod. by @a"). */
const CREDIT_JOINERS = new Set(["x", "&", "and", "+", "feat", "ft", "featuring", "w/", "with", "prod", "produced", "by"])
const PUNCTUATION = /^[.:;!?"]+|[.:;!?"]+$/g

type Token = { raw: string; text: string; group: number; comma: boolean }
type Kind = "title" | "bpm" | "key" | "credit" | "drop"

/** Splits on spaces, underscores, commas and pipes; brackets start a numbered group. */
function tokenize(stem: string): Token[] {
  // "dark-trap-140bpm-Am": hyphens are the word separator when there are no spaces.
  const separator = /[\s_]/.test(stem) ? /[\s_,;|]/ : /[\s_,;|-]/
  const tokens: Token[] = []
  let group = 0
  let nextGroup = 1
  let current = ""

  const push = () => {
    const text = current.replace(PUNCTUATION, "")
    if (text) tokens.push({ raw: current, text, group, comma: false })
    current = ""
  }

  for (const ch of stem) {
    if ("([{".includes(ch)) {
      push()
      group = nextGroup++
    } else if (")]}".includes(ch)) {
      push()
      group = 0
    } else if (separator.test(ch)) {
      push()
      if (ch === "," && tokens.length) tokens[tokens.length - 1].comma = true
    } else {
      current += ch
    }
  }
  push()
  return tokens
}

function normalizeKey(note: string, accidental = "", quality = ""): string {
  const name = `${note.toUpperCase()}${accidental.replace("♯", "#").replace("♭", "b")}`
  if (!quality) return name
  return `${name} ${quality.toLowerCase().startsWith("maj") ? "major" : "minor"}`
}

function bpmInRange(value: number, min = BPM_MIN, max = BPM_MAX): boolean {
  return value >= min && value <= max
}

/**
 * Pulls a clean title plus BPM, key and credits from producer filenames, whatever
 * the layout: "Night Drive 140bpm F#min.wav", "night_drive_92_BPM_Cm.mp3",
 * "Won't Do (138bpm, Dmin) @juice.mp3", "Sweet Nothings [147bpm, Cmaj] @juiceman.mp3",
 * "Dramatic @juice x @mac 134bpm, Emin.mp3", "Crystalized 150, @juice.mp3".
 *
 * A key spelled out ("Cmin", "F# minor", "C#m") is found anywhere after the first word.
 * A short key ("G", "Am", "Bb") only counts inside brackets, right after the BPM, or at
 * the end, so titles like "A Night Drive" or "Who Am I" keep their words.
 */
export function parseFilenameHints(filename: string): FilenameHints {
  const base = filename.split(/[\\/]/).pop() ?? filename
  const stem = base.replace(/\.[a-z0-9]{2,4}$/i, "")
  const tokens = tokenize(stem)
  const kinds: Kind[] = tokens.map(() => "title")
  const lower = tokens.map((t) => t.text.toLowerCase())

  const isCredit = (i: number) => tokens[i]?.text.startsWith("@") && tokens[i].text.length > 1
  const isJoiner = (i: number) => CREDIT_JOINERS.has(lower[i]?.replace(/\.$/, ""))
  /** Joiner words count only when they lead to a credit ("feat. @a"), not "X Gon Give". */
  const leadsToCredit = (i: number): boolean => {
    let j = i + 1
    while (j < tokens.length && isJoiner(j)) j++
    return isCredit(j)
  }
  /** Everything after i is credits, joiners or dashes (a short key before the BPM stays in the title). */
  const onlyExtrasAfter = (i: number): boolean =>
    tokens.slice(i + 1).every((t, offset) => isCredit(i + 1 + offset) || isJoiner(i + 1 + offset) || /^-+$/.test(t.text))

  let bpm: number | undefined
  let key: string | undefined
  const credits: string[] = []

  for (let i = 0; i < tokens.length; i++) {
    if (kinds[i] !== "title") continue
    const token = tokens[i]
    const word = lower[i]
    const next = lower[i + 1]

    if (isCredit(i)) {
      kinds[i] = "credit"
      if (!credits.includes(token.text)) credits.push(token.text)
      continue
    }
    if (isJoiner(i) && leadsToCredit(i)) {
      kinds[i] = "drop"
      continue
    }

    if (bpm === undefined) {
      const unit = word.match(BPM_WITH_UNIT)
      const unitValue = unit ? Number(unit[1] ?? unit[2]) : NaN
      if (unit && bpmInRange(unitValue)) {
        bpm = unitValue
        kinds[i] = "bpm"
        continue
      }
      // "140 bpm" / "BPM 140"
      if (BARE_NUMBER.test(word) && next === "bpm" && bpmInRange(Number(word))) {
        bpm = Number(word)
        kinds[i] = "bpm"
        kinds[i + 1] = "drop"
        continue
      }
      if (word === "bpm" && BARE_NUMBER.test(next ?? "") && bpmInRange(Number(next))) {
        bpm = Number(next)
        kinds[i] = "drop"
        kinds[i + 1] = "bpm"
        continue
      }
      // "(150)" or "Crystalized 150, @juice"
      if (i > 0 && BARE_NUMBER.test(word) && (token.group > 0 || token.comma) && bpmInRange(Number(word), BARE_BPM_MIN, BARE_BPM_MAX)) {
        bpm = Number(word)
        kinds[i] = "bpm"
        continue
      }
    }

    if (key === undefined && i > 0) {
      // "key Cm" / "key: Cm"
      if (word === "key" && KEY_TOKEN.test(next ?? "")) {
        kinds[i] = "drop"
        continue
      }
      // "F# minor", "Bb Major"
      const note = token.text.match(NOTE_ONLY)
      if (note && QUALITY_WORD.test(next ?? "")) {
        key = normalizeKey(note[1], note[2], next)
        kinds[i] = "key"
        kinds[i + 1] = "drop"
        continue
      }
      const match = token.text.match(KEY_TOKEN)
      if (match) {
        const [, letter, accidental = "", quality = ""] = match
        const spelledOut = /^(maj|min)/i.test(quality) || /[#♯♭]/.test(accidental)
        const afterBpm = kinds[i - 1] === "bpm" || (kinds[i - 1] === "drop" && kinds[i - 2] === "bpm")
        const afterKeyWord = lower[i - 1] === "key"
        if (spelledOut || token.group > 0 || afterBpm || afterKeyWord || onlyExtrasAfter(i)) {
          key = normalizeKey(letter, accidental, quality)
          kinds[i] = "key"
          continue
        }
      }
    }
  }

  // Rebuild the title from what's left, keeping non-metadata brackets ("(Remix)").
  const parts: string[] = []
  let openGroup = 0
  let groupWords: string[] = []
  const closeGroup = () => {
    if (openGroup && groupWords.length) parts.push(`(${groupWords.join(" ")})`)
    openGroup = 0
    groupWords = []
  }
  tokens.forEach((token, i) => {
    if (kinds[i] !== "title" || /^-+$/.test(token.text)) return
    if (token.group !== openGroup) closeGroup()
    if (token.group > 0) {
      openGroup = token.group
      groupWords.push(token.raw)
    } else {
      parts.push(token.raw)
    }
  })
  closeGroup()

  const title = parts.join(" ").replace(/\s+/g, " ").trim()
  return {
    title: title || stem,
    ...(bpm ? { bpm } : {}),
    ...(key ? { key } : {}),
    ...(credits.length ? { credits } : {}),
  }
}

/**
 * Splits a credits field into handles: "@juice x @keyon, @mac" → ["@juice", "@keyon", "@mac"].
 * Joiners: commas, "x", "&", "+", "and", "feat.", "ft.", "with". Names may have spaces ("Juice Man").
 */
export function parseCredits(input: string | null | undefined): string[] {
  if (!input) return []
  const parts = input
    .split(/\s*[,;]\s*|\s+(?:x|&|\+|and|feat\.?|ft\.?|with)\s+/i)
    .map((part) => part.trim())
    .filter(Boolean)
  return [...new Set(parts)]
}

export type TrackTitleInput = { title: string; bpm?: number | null; key?: string | null; credits?: string[] | null }

/**
 * The display name for a track: "Won't Do (138 BPM, D minor) @juice x @keyon".
 * Missing parts are left out: "Cinema (124 BPM) @juice", "Cinema @juice", "Cinema".
 */
export function formatTrackTitle({ title, bpm, key, credits }: TrackTitleInput): string {
  const details = [bpm ? `${bpm} BPM` : null, key || null].filter(Boolean).join(", ")
  return [title.trim(), details ? `(${details})` : null, credits?.length ? credits.join(" x ") : null]
    .filter(Boolean)
    .join(" ")
}
