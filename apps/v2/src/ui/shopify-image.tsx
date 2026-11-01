import type { ComponentProps } from 'react'

// 400 and 560 fill the gaps phones land in (a 2-up card needs ~360px at DPR 1.75, a 68vw featured card
// ~490px), so they no longer jump to the next 480/640 file (phase 07.2).
export const SHOPIFY_WIDTHS = [320, 400, 480, 560, 640, 768, 960, 1200, 1600] as const

/** Shopify CDN URL resized via the `width` query parameter. */
export function shopifyImageUrl(src: string, width: number) {
  const url = new URL(src, 'https://cdn.shopify.com')
  url.searchParams.set('width', String(width))
  return src.startsWith('http') ? url.toString() : `${url.pathname}${url.search}`
}

export function buildSrcSet(src: string, widths: readonly number[] = SHOPIFY_WIDTHS) {
  return widths.map((w) => `${shopifyImageUrl(src, w)} ${w}w`).join(', ')
}

type ShopifyImageProps = Omit<ComponentProps<'img'>, 'src' | 'srcSet' | 'width' | 'height' | 'alt'> & {
  src: string
  width: number
  height: number
  alt: string
  sizes: string
  /** Only the page's LCP image: eager, high fetch priority. */
  priority?: boolean
}

export function ShopifyImage({ src, width, height, alt, sizes, priority = false, ...rest }: ShopifyImageProps) {
  return (
    <img
      {...rest}
      src={shopifyImageUrl(src, Math.min(width * 2, 1600))}
      srcSet={buildSrcSet(src)}
      sizes={sizes}
      width={width}
      height={height}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
    />
  )
}
