import type { ProductsPageResponse, ProductDetailResponse } from './queries'

// Lightweight product shapes for v2.  @organic/content-schema Zod validation
// can be layered on in a later pass once the package is wired into apps/v2.

export interface ProductImage {
  url: string
  altText: string | null
  width: number
  height: number
}

export interface AudioPreviewUrl {
  preview_title: string
  preview_url: string
}

export interface Product {
  id: string
  handle: string
  name: string
  variantId: string
  price: number
  category: string
  tags: string[]
  availableForSale: boolean
  image: ProductImage | null
  audioPreview: AudioPreviewUrl | null
  created_at: string
}

export interface ProductDetail extends Product {
  description: string
  descriptionHtml: string
  images: ProductImage[]
  audioPreviewMetafield: ProductDetailResponse['product']['audioPreviewMetafield']
  whatsIncludedMetafield: ProductDetailResponse['product']['whatsIncludedMetafield']
}

function parseAudioPreviewUrls(raw: string | null | undefined): AudioPreviewUrl[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is AudioPreviewUrl =>
        typeof item?.preview_title === 'string' && typeof item?.preview_url === 'string',
    )
  } catch {
    return []
  }
}

export function parseProductsPage(
  edges: ProductsPageResponse['products']['edges'],
): Product[] {
  return edges.flatMap(({ node }) => {
    const variant = node.variants.edges[0]?.node
    if (!variant) return []

    return [
      {
        id: node.id,
        handle: node.handle,
        name: node.title,
        variantId: variant.id,
        price: parseFloat(variant.price.amount),
        category: node.productType.toLowerCase(),
        tags: node.tags.map((t) => t.toLowerCase()),
        availableForSale: node.availableForSale,
        image: node.featuredImage,
        audioPreview: parseAudioPreviewUrls(node.metafield?.value)[0] ?? null,
        created_at: node.createdAt,
      },
    ]
  })
}

export function parseProductDetail(raw: ProductDetailResponse['product']): ProductDetail {
  const variant = raw.variants.edges[0]?.node

  return {
    id: raw.id,
    handle: raw.handle,
    name: raw.title,
    variantId: variant?.id ?? '',
    price: parseFloat(variant?.price.amount ?? '0'),
    category: raw.productType.toLowerCase(),
    tags: raw.tags.map((t) => t.toLowerCase()),
    availableForSale: raw.availableForSale,
    image: raw.featuredImage,
    audioPreview: parseAudioPreviewUrls(raw.audioPreviewMetafield?.value)[0] ?? null,
    created_at: raw.createdAt,
    description: raw.description,
    descriptionHtml: raw.descriptionHtml,
    images: raw.images.edges.map((e) => e.node),
    audioPreviewMetafield: raw.audioPreviewMetafield,
    whatsIncludedMetafield: raw.whatsIncludedMetafield,
  }
}
