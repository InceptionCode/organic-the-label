import { describe, it, expect } from "vitest"
import { spotifyEmbedSrc, musoEmbedSrc } from "@/lib/work-with-me/embeds"

// Pure URL parsing for the Work With Me page embeds. An empty or malformed
// string must return null so the component renders its placeholder card
// instead of pointing an iframe at an unexpected value.

describe("spotifyEmbedSrc", () => {
  it("normalizes a bare open.spotify.com artist URL to its /embed/ form", () => {
    expect(spotifyEmbedSrc("https://open.spotify.com/artist/1abcDEF23456ghiJKL7890")).toBe(
      "https://open.spotify.com/embed/artist/1abcDEF23456ghiJKL7890",
    )
  })

  it("accepts a URL that already points at /embed/", () => {
    expect(spotifyEmbedSrc("https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M")).toBe(
      "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M",
    )
  })

  it("ignores query params and extra path segments", () => {
    expect(
      spotifyEmbedSrc("https://open.spotify.com/album/1abc?si=xyz&utm_source=copy"),
    ).toBe("https://open.spotify.com/embed/album/1abc")
  })

  it("rejects an unknown resource kind", () => {
    expect(spotifyEmbedSrc("https://open.spotify.com/user/organicsonics")).toBeNull()
  })

  it("rejects a non-spotify host", () => {
    expect(spotifyEmbedSrc("https://open.spotify.com.evil.com/artist/1abc")).toBeNull()
    expect(spotifyEmbedSrc("https://youtube.com/artist/1abc")).toBeNull()
  })

  it("rejects non-https and non-URL input", () => {
    expect(spotifyEmbedSrc("http://open.spotify.com/artist/1abc")).toBeNull()
    expect(spotifyEmbedSrc("javascript:alert(1)")).toBeNull()
    expect(spotifyEmbedSrc("")).toBeNull()
  })
})

describe("musoEmbedSrc", () => {
  it("accepts an https muso.ai URL", () => {
    expect(musoEmbedSrc("https://credits.muso.ai/profile/abc-123")).toBe(
      "https://credits.muso.ai/profile/abc-123",
    )
  })

  it("rejects a look-alike host", () => {
    expect(musoEmbedSrc("https://muso.ai.evil.com/profile/abc")).toBeNull()
  })

  it("rejects non-https and empty input", () => {
    expect(musoEmbedSrc("http://muso.ai/profile/abc")).toBeNull()
    expect(musoEmbedSrc("")).toBeNull()
  })
})
