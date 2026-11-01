import { TAG_OPTIONS } from '~/lib/store-search'
import type { Product } from '~/server/shopify/types'
import { Price } from '~/ui/price'

// Shopify tags are lowercase ("hiphop"); show the same labels as the store's tag filter ("Hip-Hop").
const TAG_LABELS = new Map<string, string>(TAG_OPTIONS.map((o) => [o.value, o.label]))
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const tagLabel = (tag: string) => TAG_LABELS.get(tag.toLowerCase()) ?? capitalize(tag)

/** Category label, Bebas title, price, description in sand, tags as plain text. */
export function ProductInfo({ product }: { product: Product }) {
  const isFree = product.price !== null && Number(product.price.amount) === 0
  const tags = product.tags.filter((t) => t !== 'exclusive').map(tagLabel)

  return (
    <div>
      {product.category && <p className="text-label">{capitalize(product.category)}</p>}

      <h1 className="mt-3 text-h1 text-primary [overflow-wrap:anywhere] lg:text-[length:clamp(3.25rem,5vw,6rem)]">{product.title}</h1>

      {product.price && (
        <div className="mt-5 flex items-baseline gap-3">
          <Price amount={product.price.amount} currencyCode={product.price.currencyCode} className="text-[1.75rem] leading-none" />
          {isFree && <span className="text-label text-accent">Free</span>}
        </div>
      )}

      {product.descriptionHtml ? (
        <div
          className="mt-6 max-w-[56ch] text-body-m text-secondary [&_li]:mb-1 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
        />
      ) : product.description ? (
        <p className="mt-6 max-w-[56ch] text-body-m text-secondary">{product.description}</p>
      ) : null}

      {tags.length > 0 && (
        <p className="mt-4 text-label">
          <span className="sr-only">Tags: </span>
          {tags.join(' · ')}
        </p>
      )}
    </div>
  )
}
