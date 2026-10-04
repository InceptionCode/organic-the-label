/** Shopify Files cap for generic (non-image, non-video) files such as .mp3, .zip, .txt. */
export const SHOPIFY_GENERIC_FILE_MAX_BYTES = 20 * 1024 * 1024

/** Preview length bounds, in seconds. */
export const PREVIEW_MIN_SECONDS = 15
export const PREVIEW_MAX_SECONDS = 30

/** Bitrates, in kbps. */
export const PREVIEW_BITRATE_KBPS = 192
export const COMPOSITION_BITRATE_KBPS = 320

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function fitsShopifyFiles(bytes: number): boolean {
  return bytes > 0 && bytes <= SHOPIFY_GENERIC_FILE_MAX_BYTES
}
