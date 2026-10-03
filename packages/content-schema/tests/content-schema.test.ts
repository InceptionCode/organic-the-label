import { describe, it, expect } from "vitest"
import {
  buildAudioPreviewUrlsMetafield,
  buildWhatsIncludedMetafield,
  CompositionBundleManifestSchema,
  defaultPreviewSpec,
  digitalDownloadFileName,
  fitsShopifyFiles,
  lintProduct,
  nextBundleVersion,
  parseFilenameHints,
  previewFilterChain,
  PreviewSpecSchema,
  renderCompositionTerms,
  SHOPIFY_GENERIC_FILE_MAX_BYTES,
  shopifyFileNames,
  slugify,
  toFfmpegMetadata,
  zipEntryNames,
} from "../src"

const SHA = "a".repeat(64)
const CDN = "https://cdn.shopify.com/s/files/1/0000/0000/files"

describe("slugify", () => {
  it("normalizes titles into URL-safe slugs", () => {
    expect(slugify("Midnight Rhodes Loop")).toBe("midnight-rhodes-loop")
    expect(slugify("  Café Noir — F# Minor!! ")).toBe("cafe-noir-f-sharp-minor")
    expect(slugify("R&B Pack")).toBe("r-and-b-pack")
  })
})

describe("file naming", () => {
  it("builds Shopify Files names with kind prefixes", () => {
    expect(shopifyFileNames.productPreview("night-drive-pack", 0, "Night Drive")).toBe(
      "os-preview-night-drive-pack-01-night-drive.mp3",
    )
    expect(shopifyFileNames.compositionPreview("midnight-rhodes")).toBe("os-comp-preview-midnight-rhodes.mp3")
    expect(shopifyFileNames.compositionBundle("midnight-rhodes", 2)).toBe("os-comp-midnight-rhodes-v2.zip")
    expect(shopifyFileNames.freeResourceBundle("starter-kit", 1)).toBe("os-free-starter-kit-v1.zip")
  })

  it("builds zip entry names with BPM and key", () => {
    expect(
      zipEntryNames.compositionAudio({ slug: "midnight-rhodes", title: "Midnight Rhodes", bpm: 82, musicalKey: "F# minor" }),
    ).toBe("midnight-rhodes/Midnight Rhodes - 82 BPM F# minor.mp3")
    expect(zipEntryNames.compositionAudio({ slug: "x", title: "Plain" })).toBe("x/Plain.mp3")
    expect(zipEntryNames.terms("midnight-rhodes")).toBe("midnight-rhodes/Terms of Use.pdf")
    expect(zipEntryNames.terms("midnight-rhodes", ".txt")).toBe("midnight-rhodes/Terms of Use.txt")
  })

  it("suggests Digital Downloads filenames and bundle versions", () => {
    expect(digitalDownloadFileName("Night Drive: Vol. 2")).toBe("Organic Sonics - Night Drive Vol. 2.zip")
    expect(nextBundleVersion(null)).toBe(1)
    expect(nextBundleVersion("os-comp-midnight-rhodes-v3.zip")).toBe(4)
  })
})

describe("parseFilenameHints", () => {
  it("extracts bpm and key from producer filenames", () => {
    expect(parseFilenameHints("Night Drive 140bpm F#min.wav")).toEqual({
      title: "Night Drive",
      bpm: 140,
      key: "F# minor",
    })
    expect(parseFilenameHints("night_drive_92_BPM_Cm.mp3")).toEqual({ title: "night drive", bpm: 92, key: "C minor" })
  })

  it("keeps a leading article and ignores out-of-range numbers", () => {
    expect(parseFilenameHints("A Night Drive.wav")).toEqual({ title: "A Night Drive" })
    expect(parseFilenameHints("Loop 999bpm.wav").bpm).toBeUndefined()
  })

  it("treats a bare trailing note as a key", () => {
    expect(parseFilenameHints("Sunset Keys 120bpm G.wav")).toEqual({ title: "Sunset Keys", bpm: 120, key: "G" })
  })
})

describe("preview spec", () => {
  it("defaults to 30s starting 25% in, clamped to the track", () => {
    expect(defaultPreviewSpec(160)).toMatchObject({ startSec: 40, durationSec: 30 })
    expect(defaultPreviewSpec(35)).toMatchObject({ startSec: 5, durationSec: 30 })
    expect(defaultPreviewSpec(20)).toMatchObject({ startSec: 0, durationSec: 20 })
  })

  it("rejects previews outside 15–30s", () => {
    expect(PreviewSpecSchema.safeParse({ startSec: 0, durationSec: 10 }).success).toBe(false)
    expect(PreviewSpecSchema.safeParse({ startSec: 0, durationSec: 45 }).success).toBe(false)
  })

  it("builds an ffmpeg filter chain with fades and loudnorm", () => {
    expect(previewFilterChain({ startSec: 10, durationSec: 30 })).toBe(
      "afade=t=in:st=0:d=0.5,afade=t=out:st=28:d=2,loudnorm=I=-14:TP=-1:LRA=11",
    )
  })
})

describe("toFfmpegMetadata", () => {
  it("emits brand defaults and optional frames", () => {
    const pairs = Object.fromEntries(
      toFfmpegMetadata({ title: "Night Drive", bpm: 140, key: "F# minor", year: 2026, slug: "night-drive" }),
    )
    expect(pairs).toMatchObject({
      os_slug: "night-drive",
      title: "Night Drive",
      artist: "Organic Sonics",
      copyright: "© 2026 Organic Sonics",
      TBPM: "140",
      TKEY: "F# minor",
      date: "2026",
    })
    expect(pairs.album).toBeUndefined()
  })
})

describe("metafield builders", () => {
  it("builds audio_preview_urls JSON for Shopify", () => {
    const result = buildAudioPreviewUrlsMetafield([
      { preview_title: "Night Drive", preview_url: `${CDN}/os-preview-pack-01-night-drive.mp3` },
    ])
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(JSON.parse(result.value)).toEqual([
        { preview_title: "Night Drive", preview_url: `${CDN}/os-preview-pack-01-night-drive.mp3` },
      ])
    }
  })

  it("rejects non-Shopify URLs and empty titles", () => {
    const result = buildAudioPreviewUrlsMetafield([{ preview_title: "", preview_url: "https://example.com/a.mp3" }])
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors).toHaveLength(2)
  })

  it("drops empty optional whats_included fields", () => {
    const result = buildWhatsIncludedMetafield([{ label: "24 beats", icon: "music" }])
    expect(result).toEqual({ ok: true, value: JSON.stringify([{ icon: "music", label: "24 beats" }], null, 2) })
  })
})

describe("lintProduct", () => {
  const base = {
    id: "gid://shopify/Product/1",
    title: "Night Drive",
    productType: "Pack",
    tags: ["Trap", "dark"],
    audioPreviewUrls: JSON.stringify([{ preview_title: "a", preview_url: `${CDN}/a.mp3` }]),
  }

  it("passes a valid product (case-insensitive)", () => {
    expect(lintProduct(base)).toEqual([])
  })

  it("flags unknown tags, bad types, and broken metafield JSON", () => {
    const issues = lintProduct({ ...base, productType: "Loops", tags: ["lofi"], whatsIncluded: "{nope" })
    expect(issues.map((i) => i.field)).toEqual(["productType", "tags", "whats_included"])
    expect(issues.every((i) => i.severity === "error")).toBe(true)
  })

  it("warns (not errors) on missing previews, except merch", () => {
    expect(lintProduct({ ...base, audioPreviewUrls: null })).toEqual([
      expect.objectContaining({ field: "audio_preview_urls", severity: "warning" }),
    ])
    expect(lintProduct({ ...base, productType: "merch", audioPreviewUrls: null })).toEqual([])
  })
})

describe("renderCompositionTerms", () => {
  it("prepends a composition header to the canonical terms", () => {
    const text = renderCompositionTerms({
      slug: "midnight-rhodes",
      title: "Midnight Rhodes",
      bpm: 82,
      musicalKey: "F# minor",
      issuedAt: new Date("2026-09-28T12:00:00Z"),
      baseTerms: "Canonical license text.\r\n",
    })
    expect(text).toContain("Composition: Midnight Rhodes (82 BPM, F# minor)")
    expect(text).toContain("Reference: midnight-rhodes")
    expect(text).toContain("Issued: 2026-09-28")
    expect(text.endsWith("Canonical license text.\n")).toBe(true)
  })

  it("refuses empty terms", () => {
    expect(() => renderCompositionTerms({ slug: "x", title: "X", baseTerms: "  " })).toThrow()
  })
})

describe("CompositionBundleManifestSchema", () => {
  const manifest = {
    schema_version: 1,
    slug: "midnight-rhodes",
    title: "Midnight Rhodes",
    bpm: 82,
    musical_key: "F# minor",
    files: [
      {
        role: "audio",
        name: "midnight-rhodes/Midnight Rhodes - 82 BPM F# minor.mp3",
        bytes: 4_000_000,
        sha256: SHA,
        format: "mp3",
        bitrate_kbps: 320,
        duration_seconds: 98.2,
      },
      { role: "terms", name: "midnight-rhodes/Terms of Use.pdf", bytes: 2048, sha256: SHA },
    ],
    terms_source_url: `${CDN}/organic-sonics-terms-of-use.txt`,
    bundle_file_name: "os-comp-midnight-rhodes-v1.zip",
    bundle_bytes: 3_900_000,
    bundle_sha256: SHA,
    built_at: "2026-09-28T12:00:00.000Z",
  }

  it("accepts a valid manifest", () => {
    expect(CompositionBundleManifestSchema.safeParse(manifest).success).toBe(true)
  })

  it("requires exactly one audio and one terms file", () => {
    const result = CompositionBundleManifestSchema.safeParse({ ...manifest, files: [manifest.files[0]] })
    expect(result.success).toBe(false)
  })

  it("rejects stems and non-mp3 audio", () => {
    const wav = { ...manifest.files[0], format: "wav" }
    expect(CompositionBundleManifestSchema.safeParse({ ...manifest, files: [wav, manifest.files[1]] }).success).toBe(false)
  })
})

describe("limits", () => {
  it("enforces the Shopify Files 20 MB cap", () => {
    expect(fitsShopifyFiles(SHOPIFY_GENERIC_FILE_MAX_BYTES)).toBe(true)
    expect(fitsShopifyFiles(SHOPIFY_GENERIC_FILE_MAX_BYTES + 1)).toBe(false)
    expect(fitsShopifyFiles(0)).toBe(false)
  })
})
