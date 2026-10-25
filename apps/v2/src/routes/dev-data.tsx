import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { productQueries } from '~/queries/products'

// Temporary SSR hydration check (phase 01.10). Delete at the end of phase 03.
export const Route = createFileRoute('/dev-data')({
  loader: ({ context }) => context.queryClient.ensureQueryData(productQueries.newest(5)),
  component: DevData,
})

function DevData() {
  const { data: products } = useSuspenseQuery(productQueries.newest(5))
  return (
    <section className="p-6">
      <h1>Newest products</h1>
      <ul data-testid="newest-products">
        {products.map((p) => (
          <li key={p.id}>
            {p.title} {p.price ? `${p.price.amount} ${p.price.currencyCode}` : ''}
          </li>
        ))}
      </ul>
    </section>
  )
}
