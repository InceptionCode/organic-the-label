import type { CSSProperties } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { formatMoney } from '~/lib/format'
import type { ProductSummary } from '~/server/shopify/types'
import { cn } from '~/ui/cn'
import { ShopifyImage } from '~/ui/shopify-image'

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-4 focus-visible:ring-offset-[color:var(--bg-canvas)]'

/**
 * The 8 newest products: label column, then borderless artwork with name, type and price below,
 * ending with a "Browse the store" tile where the grid has room.
 */
export function FeaturedKits({ products }: { products: ProductSummary[] }) {
  if (products.length === 0) return null
  return (
    <section aria-labelledby="featured-kits-heading" className="section-y-standard hairline-t">
      <div className="content-container grid gap-8 lg:grid-cols-12 lg:gap-8">
        <div className="flex items-end justify-between gap-6 lg:col-span-3 lg:flex-col lg:items-start lg:justify-start">
          <div>
            <h2 id="featured-kits-heading" className="text-h1 text-primary">
              FEATURED KITS
            </h2>
            <p className="mt-3 text-label">New arrivals</p>
          </div>
          <Link to="/store" className={cn('link-underline inline-flex min-h-11 items-center rounded-sm text-body-s text-primary lg:mt-4', focusRing)}>
            View all
          </Link>
        </div>

        <ul
          aria-label="Featured kits"
          className="no-scrollbar -mx-6 flex snap-x snap-mandatory scroll-pl-6 gap-4 overflow-x-auto px-6 md:mx-0 md:grid md:grid-cols-3 md:gap-x-6 md:gap-y-12 md:overflow-visible md:px-0 lg:col-span-9 xl:grid-cols-4"
        >
          {products.map((product, i) => (
            <li key={product.id} className="os-reveal-item w-[68vw] max-w-[300px] flex-none snap-start md:w-auto md:max-w-none" style={{ '--i': i } as CSSProperties}>
              <KitItem product={product} />
            </li>
          ))}
          <li
            className={cn(
              'os-reveal-item w-[68vw] max-w-[300px] flex-none snap-start md:w-auto md:max-w-none',
              mdSpan[(3 - (products.length % 3)) % 3],
              xlSpan[(4 - (products.length % 4)) % 4],
            )}
            style={{ '--i': products.length } as CSSProperties}
          >
            {/* Mirrors the outer columns so a 3:4 spacer in the first one gives exactly one artwork's height. */}
            <div className="relative grid grid-cols-[repeat(var(--span,1),minmax(0,1fr))] gap-x-6">
              <div aria-hidden="true" className="aspect-[3/4]" />
              <BrowseStoreTile />
            </div>
          </li>
        </ul>
      </div>
    </section>
  )
}

// The store tile fills the empty slots of the last grid row and never starts a row of its own.
// Always shown at the end of the mobile scroll row. Index = number of empty slots.
const mdSpan = ['md:hidden', 'md:block md:col-span-1', 'md:block md:col-span-2 md:[--span:2]'] as const
const xlSpan = [
  'xl:hidden',
  'xl:block xl:col-span-1 xl:[--span:1]',
  'xl:block xl:col-span-2 xl:[--span:2]',
  'xl:block xl:col-span-3 xl:[--span:3]',
] as const

function BrowseStoreTile() {
  return (
    <Link
      to="/store"
      className={cn(
        'group absolute inset-0 flex flex-col justify-between border border-[color:var(--border-default)] bg-surface-1 p-6 transition-colors duration-[var(--motion-medium)] ease-[var(--ease-soft)] hover:border-[color:var(--border-strong)] hover:bg-surface-2 active:opacity-80 lg:p-8',
        focusRing,
      )}
    >
      <ArrowUpRight
        aria-hidden
        className="size-7 self-end text-muted transition-transform duration-[var(--motion-medium)] ease-[var(--ease-spring)] group-hover:translate-x-1 group-hover:-translate-y-1"
      />
      <span>
        <span className="block text-h1 text-primary">BROWSE THE STORE</span>
        <span className="mt-3 block text-label">Every kit, beat and pack</span>
      </span>
    </Link>
  )
}

function KitItem({ product }: { product: ProductSummary }) {
  return (
    <Link to="/store/$handle" params={{ handle: product.handle }} className={cn('group block rounded-sm active:opacity-80', focusRing)}>
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-1">
        {product.image?.url ? (
          <ShopifyImage
            src={product.image.url}
            alt={product.image.altText || product.title}
            width={600}
            height={800}
            sizes="(max-width: 768px) 68vw, (max-width: 1280px) 25vw, 20vw"
            className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-[var(--ease-spring)] group-hover:scale-[1.02]"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-caption text-muted">No image</span>
        )}
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <p className="min-w-0 text-body-m font-medium text-primary">{product.title}</p>
        {product.price && (
          <p className="shrink-0 text-body-s tabular-nums text-secondary">
            {formatMoney(product.price.amount, product.price.currencyCode)}
          </p>
        )}
      </div>
      {product.category && <p className="mt-1 text-label capitalize">{product.category}</p>}
    </Link>
  )
}
