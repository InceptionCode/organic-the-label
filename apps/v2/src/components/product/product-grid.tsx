import type { CSSProperties } from 'react'
import type { ProductSummary } from '~/server/shopify/types'
import { cn } from '~/ui/cn'
import { ProductCard } from './product-card'

/** Grid used by the store, search and explore: 2 / 3 / 4 / 5 columns, wide row gaps, no card chrome. */
export const productGridClasses =
  'grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 md:gap-y-14 lg:grid-cols-4 lg:gap-x-8 2xl:grid-cols-5'

type ProductGridProps = { products: ProductSummary[]; priorityFirst?: boolean; className?: string }

export function ProductGrid({ products, priorityFirst = false, className }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-16 text-center text-muted">
        <p className="text-body-m">No products found.</p>
      </div>
    )
  }

  return (
    <div data-testid="product-grid" className={cn(productGridClasses, className)}>
      {products.map((product, i) => (
        <div key={product.id} className="os-rise flex flex-col" style={{ '--col': i % 4 } as CSSProperties}>
          <ProductCard product={product} priority={priorityFirst && i === 0} />
        </div>
      ))}
    </div>
  )
}
