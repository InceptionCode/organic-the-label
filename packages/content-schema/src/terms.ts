import { BRAND_ARTIST, SITE_ORIGIN } from "./audio"

export type TermsInput = {
  slug: string
  title: string
  bpm?: number | null
  musicalKey?: string | null
  issuedAt?: Date
  /**
   * The canonical license text (the shared terms-of-use file in Shopify Files).
   * The admin app fetches it; this package never authors license wording.
   */
  baseTerms: string
}

/**
 * Renders the "Terms of Use.txt" bundled with a free composition download:
 * a short header identifying the composition, followed by the canonical terms.
 */
export function renderCompositionTerms({
  slug,
  title,
  bpm,
  musicalKey,
  issuedAt = new Date(),
  baseTerms,
}: TermsInput): string {
  const body = baseTerms.replace(/\r\n/g, "\n").trim()
  if (!body) throw new Error("Terms text is empty")

  const details = [bpm ? `${bpm} BPM` : null, musicalKey || null].filter(Boolean).join(", ")
  const header = [
    `${BRAND_ARTIST}: Terms of Use`,
    `Composition: ${title}${details ? ` (${details})` : ""}`,
    `Reference: ${slug}`,
    `Issued: ${issuedAt.toISOString().slice(0, 10)}`,
    `Source: ${SITE_ORIGIN}/compositions`,
  ].join("\n")

  return `${header}\n\n${"-".repeat(60)}\n\n${body}\n`
}
