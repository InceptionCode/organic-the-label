import { formatTrackTitle } from "./audio"

// Naming rules for every file the admin app produces.
// Shopify Files names are flat and global, so every name carries a kind
// prefix and the owner's slug/handle. Shopify silently suffixes duplicate
// names, so bundles also carry a version.

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/#/g, " sharp ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80)
    .replace(/-+$/g, "")
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Filename-safe display name for files that end up on a user's disk. */
export function safeDisplayName(input: string): string {
  return input
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 120)
}

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

export const shopifyFileNames = {
  /** Product preview: os-preview-{handle}-{nn}-{track}.mp3 */
  productPreview(handle: string, index: number, trackTitle: string): string {
    return `os-preview-${slugify(handle)}-${pad2(index + 1)}-${slugify(trackTitle)}.mp3`
  },
  /** Composition preview: os-comp-preview-{slug}.mp3 */
  compositionPreview(slug: string): string {
    return `os-comp-preview-${slugify(slug)}.mp3`
  },
  /** Composition bundle: os-comp-{slug}-v{n}.zip */
  compositionBundle(slug: string, version: number): string {
    return `os-comp-${slugify(slug)}-v${version}.zip`
  },
  /** Free resource bundle: os-free-{slug}-v{n}.zip */
  freeResourceBundle(slug: string, version: number): string {
    return `os-free-${slugify(slug)}-v${version}.zip`
  },
}

export type ZipEntryNameInput = {
  slug: string
  title: string
  bpm?: number | null
  musicalKey?: string | null
  credits?: string[] | null
}

export const zipEntryNames = {
  /** "{slug}/{Title} ({BPM} BPM, {Key}) {credits}.mp3", the bracketed track name (formatTrackTitle). */
  compositionAudio({ slug, title, bpm, musicalKey, credits }: ZipEntryNameInput): string {
    const name = safeDisplayName(formatTrackTitle({ title, bpm, key: musicalKey, credits }))
    return `${slugify(slug)}/${name}.mp3`
  },
  /** "{slug}/Terms of Use.pdf". The canonical terms file is bundled unchanged. */
  terms(slug: string, extension = "pdf"): string {
    return `${slugify(slug)}/Terms of Use.${extension.replace(/^\./, "")}`
  },
}

/** Suggested filename for a paid deliverable attached in the Digital Downloads app. */
export function digitalDownloadFileName(productTitle: string, extension = "zip"): string {
  return `Organic Sonics - ${safeDisplayName(productTitle)}.${extension.replace(/^\./, "")}`
}

/** Next bundle version given the previous bundle filename (or none). */
export function nextBundleVersion(previousFileName?: string | null): number {
  const match = previousFileName?.match(/-v(\d+)\.zip$/)
  return match ? Number(match[1]) + 1 : 1
}
