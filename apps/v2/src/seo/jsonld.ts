import type { JSX } from 'react'
import type { Product } from '~/server/shopify/types'
import { LOGO_PATH, SITE_NAME, SITE_ORIGIN, SOCIAL_PROFILES, absoluteUrl } from './site'

// JSON-LD builders. Each returns one head() meta entry; TanStack renders it as
// <script type="application/ld+json"> and never dedupes these entries.

type LdValue = string | number | boolean | null | LdObject | LdValue[]
export type LdObject = { [key: string]: LdValue | undefined }
// Intersected with the <meta> props type so the entry fits React head() meta arrays, whose type
// does not list TanStack's runtime 'script:ld+json' key.
export type JsonLdMeta = { 'script:ld+json': LdObject } & JSX.IntrinsicElements['meta']

const CONTEXT = 'https://schema.org'
const BRAND = { '@type': 'Brand', name: SITE_NAME } as const
const BRAND_ORG = { '@type': 'Organization', name: SITE_NAME, url: SITE_ORIGIN } as const

function ld(obj: LdObject): JsonLdMeta {
  // Drop undefined fields so the serialized output only carries real values.
  const clean = JSON.parse(JSON.stringify({ '@context': CONTEXT, ...obj })) as LdObject
  return { 'script:ld+json': clean } as JsonLdMeta
}

export function organizationJsonLd(): JsonLdMeta {
  return ld({
    '@type': 'Organization',
    '@id': `${SITE_ORIGIN}/#organization`,
    name: SITE_NAME,
    url: SITE_ORIGIN,
    logo: absoluteUrl(LOGO_PATH),
    sameAs: SOCIAL_PROFILES.length > 0 ? [...SOCIAL_PROFILES] : undefined,
  })
}

export function websiteJsonLd(): JsonLdMeta {
  return ld({
    '@type': 'WebSite',
    '@id': `${SITE_ORIGIN}/#website`,
    name: SITE_NAME,
    url: SITE_ORIGIN,
    publisher: { '@id': `${SITE_ORIGIN}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_ORIGIN}/search?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  })
}

/** Shopify gid://shopify/ProductVariant/123 to 123. */
function gidTail(gid: string | null): string | undefined {
  return gid?.split('/').pop() || undefined
}

export type ProductJsonLdInput = Pick<
  Product,
  'handle' | 'title' | 'description' | 'category' | 'image' | 'images' | 'variantId' | 'price' | 'availableForSale'
>

export function productJsonLd(product: ProductJsonLdInput): JsonLdMeta {
  const url = `${SITE_ORIGIN}/store/${product.handle}`
  const images = [...new Set([product.image, ...product.images].filter((i) => i?.url).map((i) => i!.url))]
  const offers = product.price
    ? {
        '@type': 'Offer',
        url,
        price: product.price.amount,
        priceCurrency: product.price.currencyCode,
        availability: product.availableForSale ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
        seller: BRAND_ORG,
      }
    : undefined

  return ld({
    '@type': 'Product',
    '@id': `${url}#product`,
    name: product.title,
    description: product.description || undefined,
    image: images.length > 0 ? images : undefined,
    sku: gidTail(product.variantId),
    brand: BRAND,
    category: product.category || undefined,
    url,
    offers,
  })
}

export type BreadcrumbItem = { name: string; path: string }

export function breadcrumbJsonLd(items: BreadcrumbItem[]): JsonLdMeta {
  return ld({
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  })
}

export type CompositionJsonLdInput = {
  slug: string
  title: string
  description?: string | null
  postedAt?: string | null
  tags?: string[] | null
  musicalKey?: string | null
  /** Public preview URL; never a gated download URL. */
  previewUrl?: string | null
}

/**
 * MusicComposition when there is musical detail (audio or key), otherwise the plainer CreativeWork.
 * Loops live as #slug anchors on /compositions (no per-loop pages).
 */
export function compositionJsonLd(c: CompositionJsonLdInput): JsonLdMeta {
  const isMusic = Boolean(c.previewUrl || c.musicalKey)
  return ld({
    '@type': isMusic ? 'MusicComposition' : 'CreativeWork',
    name: c.title,
    url: `${SITE_ORIGIN}/compositions#${c.slug}`,
    description: c.description || undefined,
    [isMusic ? 'composer' : 'creator']: BRAND_ORG,
    datePublished: c.postedAt || undefined,
    genre: c.tags && c.tags.length > 0 ? c.tags : undefined,
    musicalKey: isMusic ? c.musicalKey || undefined : undefined,
    audio: c.previewUrl
      ? { '@type': 'AudioObject', contentUrl: c.previewUrl, encodingFormat: 'audio/mpeg' }
      : undefined,
    isAccessibleForFree: true,
  })
}
