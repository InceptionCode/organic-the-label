import { Link } from '@tanstack/react-router'
import { formatMoney } from '~/lib/format'
import type { ProductSummary } from '~/server/shopify/types'
import { ShopifyImage } from '~/ui/shopify-image'

type FeaturedProductCardProps = {
  product: ProductSummary
  /** Image `sizes`; the home row is a fixed 260px card. */
  sizes?: string
  className?: string
}

/**
 * The compact `featured` card (v1 featured-kits.tsx): one full-card link, 3:4 image, info panel
 * over the image, "Quick View" on hover and keyboard focus. Lives beside the `full` ProductCard;
 * kept in its own file so the store card stays untouched while other groups edit it.
 */
export function FeaturedProductCard({ product, sizes = '260px', className }: FeaturedProductCardProps) {
  return (
    <Link
      to="/store/$handle"
      params={{ handle: product.handle }}
      data-testid="featured-product-card"
      className={`group card-glass relative block overflow-hidden rounded-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] active:scale-[0.99] ${className ?? ''}`}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        {product.image?.url ? (
          <ShopifyImage
            src={product.image.url}
            alt={product.image.altText || product.title}
            width={520}
            height={693}
            sizes={sizes}
            className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-white/[0.04]">
            <span className="text-xs text-white/20">No image</span>
          </div>
        )}

        <div
          className="absolute inset-x-0 bottom-0 flex h-[55%] flex-col justify-end p-4"
          style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.7) 55%, transparent 100%)' }}
        >
          {product.category && (
            <span className="mb-1 block text-[0.6rem] uppercase tracking-[0.12em] text-[rgba(212,196,168,0.7)]">{product.category}</span>
          )}
          <p className="mb-2 line-clamp-2 font-heading text-[1.05rem] leading-tight tracking-[0.02em] text-[#F8F7F2]">{product.title}</p>
          <div className="flex items-center justify-between gap-2">
            <span className="font-heading text-[1.1rem] tracking-[0.02em] text-[#F8F7F2] tabular-nums">
              {product.price ? formatMoney(product.price.amount, product.price.currencyCode) : null}
            </span>
            <span
              aria-hidden="true"
              className="text-[0.65rem] uppercase tracking-[0.08em] text-[color:var(--accent-primary)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              Quick View →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
