import type { ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { CompositionFilters } from '~/components/compositions/composition-filters'
import { CompositionHeader } from '~/components/compositions/composition-header'
import { CompositionError, CompositionResults, CompositionResultsSkeleton } from '~/components/compositions/composition-results'
import { toCompositionListParams, validateCompositionSearch } from '~/lib/composition-search'
import { compositionQueries } from '~/queries/compositions'
import { seo } from '~/seo/head'
import { breadcrumbJsonLd, compositionsItemListJsonLd, type CompositionJsonLdInput } from '~/seo/jsonld'
import { publicPageHeaders } from '~/server/http/cache-headers'

export const Route = createFileRoute('/compositions/')({
  codeSplitGroupings: [['component', 'pendingComponent'], ['errorComponent'], ['notFoundComponent']],
  // Anonymous HTML is CDN-cached; the cache guard makes it private whenever it could be per-visitor (phase 07.3).
  headers: publicPageHeaders,
  validateSearch: validateCompositionSearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    try {
      const loops = await context.queryClient.query(compositionQueries.list(toCompositionListParams(deps)))
      const items: CompositionJsonLdInput[] = loops.map((c) => ({
        slug: c.slug,
        title: c.title,
        description: c.description,
        postedAt: c.posted_at,
        tags: c.tags,
        musicalKey: c.musical_key,
        // Public columns of a free loop (the same URL the card's player uses); never a bundle URL.
        previewUrl: c.preview_url ?? c.audio_file_url,
      }))
      return { error: false, items }
    } catch {
      // The page exists; the loops are temporarily unavailable. v1 error state with a 200.
      return { error: true, items: [] as CompositionJsonLdInput[] }
    }
  },
  head: ({ loaderData }) => {
    const head = seo({
      title: 'Compositions: Free Loops and Samples',
      description:
        'Free original loops and samples. Preview them on Instagram and YouTube, then download the full loop plus terms of use as an instant zip.',
      path: '/compositions',
    })
    const jsonLd = [
      breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Compositions', path: '/compositions' },
      ]),
      ...(loaderData?.items.length ? [compositionsItemListJsonLd(loaderData.items)] : []),
    ]
    return { ...head, meta: [...head.meta, ...jsonLd] }
  },
  pendingComponent: () => <CompositionLayout results={<CompositionResultsSkeleton />} />,
  component: CompositionsPage,
})

function CompositionsPage() {
  const { error } = Route.useLoaderData()
  const search = Route.useSearch()
  return <CompositionLayout results={error ? <CompositionError /> : <CompositionResults search={search} />} />
}

function CompositionLayout({ results }: { results: ReactNode }) {
  const search = Route.useSearch()
  return (
    <>
      <CompositionHeader />
      <CompositionFilters search={search} />
      <div className="content-container pb-16 md:pb-24">{results}</div>
    </>
  )
}
