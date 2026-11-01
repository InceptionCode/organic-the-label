import type { ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { SearchError, SearchPrompt } from '~/components/search/search-empty'
import { SearchForm } from '~/components/search/search-form'
import { SearchResults, SearchResultsSkeleton } from '~/components/search/search-results'
import { searchPageTitle, validateSiteSearch } from '~/lib/search-query'
import { productQueries } from '~/queries/products'
import { searchQueries } from '~/queries/search'
import { seo } from '~/seo/head'

export const Route = createFileRoute('/search')({
  codeSplitGroupings: [['component', 'pendingComponent'], ['errorComponent'], ['notFoundComponent']],
  validateSearch: validateSiteSearch,
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: async ({ context, deps: { q } }) => {
    try {
      if (q) await context.queryClient.query(searchQueries.results(q))
      else await context.queryClient.query(productQueries.list({ sort: 'newest' }))
      return { q, error: false }
    } catch {
      // Never a 404 or 500: an unavailable upstream renders the error state with a retry (200).
      return { q, error: true }
    }
  },
  head: ({ loaderData }) =>
    seo({
      title: searchPageTitle(loaderData?.q),
      description:
        'Search Organic Sonics for sample packs, drum kits, loops, and compositions. Find sounds by name, genre, or tag.',
      path: '/search',
      noindex: true,
    }),
  pendingComponent: () => <SearchLayout results={<SearchResultsSkeleton />} />,
  component: SearchPage,
})

function SearchPage() {
  const { q, error } = Route.useLoaderData()
  // `type` is not a loader dep: the tabs filter the already-loaded results on the client.
  const { type } = Route.useSearch()
  let results: ReactNode
  if (q && !error) results = <SearchResults q={q} type={type} />
  else if (q) results = <SearchError />
  else results = <SearchPrompt showProducts={!error} />
  return <SearchLayout results={results} />
}

function SearchLayout({ results }: { results: ReactNode }) {
  const { q } = Route.useSearch()
  return (
    <>
      {/* The field is the hero: Bebas title, then one large underline input across the container. */}
      <header className="hairline-b bg-canvas">
        <div className="content-container pb-10 pt-10 md:pb-14 md:pt-16">
          <h1 className="text-display-l mb-6 text-primary md:mb-10">Search</h1>
          <SearchForm key={q ?? ''} q={q} />
        </div>
      </header>
      <div className="content-container pb-16 pt-10 md:pb-24 md:pt-14">{results}</div>
    </>
  )
}
