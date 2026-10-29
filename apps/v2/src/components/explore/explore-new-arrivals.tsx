import type { CSSProperties } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { ProductCard } from '~/components/product/product-card'
import { productQueries } from '~/queries/products'
import { ExploreSectionLink, ExploreSplit } from './explore-section-wrapper'
import type { ExploreSectionMetadata } from './explore-sections'

/** Real newest products (the store's default list entry, shared with / and /store) in the store's card. */
export function ExploreNewArrivals({ metadata }: { metadata: ExploreSectionMetadata }) {
  const products = useSuspenseQuery(productQueries.list({ sort: 'newest' })).data.products.slice(0, 4)
  return (
    <ExploreSplit
      id={`${metadata.id}-heading`}
      title="NEW KITS AND PACKS"
      intro="The latest drops from the store, newest first."
      action={<ExploreSectionLink href="/store">Browse the store</ExploreSectionLink>}
    >
      <ul className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
        {products.map((p, i) => (
          <li key={p.id} className="os-reveal-item" style={{ '--i': i } as CSSProperties}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </ExploreSplit>
  )
}
