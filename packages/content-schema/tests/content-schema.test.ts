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
  formatTrackTitle,
  parseCredits,
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

  it("builds zip entry names with title, BPM, key and credits", () => {
    expect(
      zipEntryNames.compositionAudio({ slug: "midnight-rhodes", title: "Midnight Rhodes", bpm: 82, musicalKey: "F# minor" }),
    ).toBe("midnight-rhodes/Midnight Rhodes (82 BPM, F# minor).mp3")
    expect(
      zipEntryNames.compositionAudio({ slug: "late-night", title: "Late Night", bpm: 161, musicalKey: "Bb major", credits: ["@juice"] }),
    ).toBe("late-night/Late Night (161 BPM, Bb major) @juice.mp3")
    expect(
      zipEntryNames.compositionAudio({ slug: "what-we-doing", title: "What We Doing?", bpm: 124, musicalKey: "B minor", credits: ["@juice", "@keyon"] }),
    ).toBe("what-we-doing/What We Doing (124 BPM, B minor) @juice x @keyon.mp3")
    expect(zipEntryNames.compositionAudio({ slug: "x", title: "Plain" })).toBe("x/Plain.mp3")
    expect(zipEntryNames.compositionAudio({ slug: "x", title: "Plain", credits: [] })).toBe("x/Plain.mp3")
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
  it.each([
    ["Sweet Nothings [147bpm, Cmaj] @juiceman.mp3", { title: "Sweet Nothings", bpm: 147, key: "C major", credits: ["@juiceman"] }],
    ["title [125bpm,  Cmin] @juiceman.wav", { title: "title", bpm: 125, key: "C minor", credits: ["@juiceman"] }],
    ["Won't Do (138bpm, Dmin) @juice.mp3", { title: "Won't Do", bpm: 138, key: "D minor", credits: ["@juice"] }],
    ["ALL WORK (159bpm,D#min) @juice x @keyon.mp3", { title: "ALL WORK", bpm: 159, key: "D# minor", credits: ["@juice", "@keyon"] }],
    ["Alive (120bpm, Bmin) @juice x @keyon.mp3", { title: "Alive", bpm: 120, key: "B minor", credits: ["@juice", "@keyon"] }],
    [
      "For Nothing 164bpm, @juice x @macshooter, @gizmo7k.mp3",
      { title: "For Nothing", bpm: 164, credits: ["@juice", "@macshooter", "@gizmo7k"] },
    ],
    [
      "Dramatic @juice x @macshooter x @stevenshaeffer 134bpm, Emin.mp3",
      { title: "Dramatic", bpm: 134, key: "E minor", credits: ["@juice", "@macshooter", "@stevenshaeffer"] },
    ],
    ["Crystalized 150, @juice.mp3", { title: "Crystalized", bpm: 150, credits: ["@juice"] }],
    ["Radio 161bpm @juice.mp3", { title: "Radio", bpm: 161, credits: ["@juice"] }],
    ["What You Want Tonight (140bpm, C#min)@juice.mp3", { title: "What You Want Tonight", bpm: 140, key: "C# minor", credits: ["@juice"] }],
    ["Prelude in Bb Major 90 BPM.wav", { title: "Prelude in", bpm: 90, key: "Bb major" }],
    ["Beat BPM 140 Key Gm prod. by @juice.wav", { title: "Beat", bpm: 140, key: "G minor", credits: ["@juice"] }],
    ["dark-trap-140bpm-Am.wav", { title: "dark trap", bpm: 140, key: "A minor" }],
    ["Song (Remix) 120bpm.wav", { title: "Song (Remix)", bpm: 120 }],
    ["Track (95).wav", { title: "Track", bpm: 95 }],
  ])("parses %s", (filename, expected) => {
    expect(parseFilenameHints(filename)).toEqual(expected)
  })

  it("keeps title words that only look like keys or numbers", () => {
    expect(parseFilenameHints("Who Am I 120bpm.wav")).toEqual({ title: "Who Am I", bpm: 120 })
    expect(parseFilenameHints("I Am 120bpm.wav")).toEqual({ title: "I Am", bpm: 120 })
    expect(parseFilenameHints("X Gon Give It 95bpm.wav")).toEqual({ title: "X Gon Give It", bpm: 95 })
    expect(parseFilenameHints("Hip-Hop Essentials 90bpm.wav")).toEqual({ title: "Hip-Hop Essentials", bpm: 90 })
    expect(parseFilenameHints("Track 2.wav")).toEqual({ title: "Track 2" })
    expect(parseFilenameHints("Summer 2024.wav")).toEqual({ title: "Summer 2024" })
  })

  it("falls back to the file name when nothing is left for a title", () => {
    expect(parseFilenameHints("140bpm.wav")).toEqual({ title: "140bpm", bpm: 140 })
  })
})

describe("parseCredits", () => {
  it("splits handles on the usual joiners", () => {
    expect(parseCredits("@juice x @keyon, @mac")).toEqual(["@juice", "@keyon", "@mac"])
    expect(parseCredits("@juice & @keyon feat. @mac")).toEqual(["@juice", "@keyon", "@mac"])
    expect(parseCredits("Juice Man, Keyon")).toEqual(["Juice Man", "Keyon"])
    expect(parseCredits("@juice x @juice")).toEqual(["@juice"])
  })

  it("returns nothing for an empty field", () => {
    expect(parseCredits("")).toEqual([])
    expect(parseCredits("  ")).toEqual([])
    expect(parseCredits(null)).toEqual([])
  })

  it("round-trips the parser's credits through the field format", () => {
    const { credits } = parseFilenameHints("Alive (120bpm, Bmin) @juice x @keyon.mp3")
    expect(parseCredits(credits?.join(" x "))).toEqual(["@juice", "@keyon"])
  })
})

describe("formatTrackTitle", () => {
  it("builds the bracketed display name", () => {
    expect(formatTrackTitle({ title: "Won't Do", bpm: 138, key: "D minor", credits: ["@juice"] })).toBe("Won't Do (138 BPM, D minor) @juice")
    expect(formatTrackTitle({ title: "Alive", bpm: 120, key: "B minor", credits: ["@juice", "@keyon"] })).toBe(
      "Alive (120 BPM, B minor) @juice x @keyon",
    )
    expect(formatTrackTitle({ title: "Cinema", bpm: 124, credits: ["@juice"] })).toBe("Cinema (124 BPM) @juice")
    expect(formatTrackTitle({ title: "Cinema", key: "A minor" })).toBe("Cinema (A minor)")
    expect(formatTrackTitle({ title: "Cinema", credits: [] })).toBe("Cinema")
  })

  it("round-trips a parsed filename", () => {
    expect(formatTrackTitle(parseFilenameHints("title [125bpm,  Cmin] @juiceman.wav"))).toBe("title (125 BPM, C minor) @juiceman")
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

  it("accepts optional credits and keeps them", () => {
    const parsed = CompositionBundleManifestSchema.parse({ ...manifest, credits: ["@juice", "@keyon"] })
    expect(parsed.credits).toEqual(["@juice", "@keyon"])
    expect(CompositionBundleManifestSchema.safeParse({ ...manifest, credits: [""] }).success).toBe(false)
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
