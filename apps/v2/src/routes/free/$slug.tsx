import { createFileRoute, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { FreeResourceView } from '~/components/free/free-resource-view'
import { freeSlugDescription, freeSlugTitle } from '~/lib/free-seo'
import { freeResourceQueries } from '~/queries/free-resources'
import { seo } from '~/seo/head'
import { breadcrumbJsonLd, freeResourceJsonLd } from '~/seo/jsonld'
import { CDN_TAG, publicPageHeaders } from '~/server/http/cache-headers'

export const Route = createFileRoute('/free/$slug')({
  codeSplitGroupings: [['component', 'pendingComponent'], ['errorComponent'], ['notFoundComponent']],
  // Anonymous HTML is CDN-cached; the cache guard makes it private whenever it could be per-visitor (phase 07.3).
  headers: () => publicPageHeaders([CDN_TAG.freeResources, CDN_TAG.products]),
  loader: async ({ context, params }) => {
    const resource = await context.queryClient.query(freeResourceQueries.bySlug(params.slug))
    // Unknown or inactive slug: a real 404 (pages/free.md).
    if (!resource) throw notFound()
    return { resource }
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    const { resource } = loaderData
    const path = `/free/${resource.slug}`
    const head = seo({ title: freeSlugTitle(resource.name), description: freeSlugDescription(resource.description), path })
    const jsonLd = [
      breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Free', path: '/free' },
        { name: resource.name, path },
      ]),
      freeResourceJsonLd({ slug: resource.slug, name: resource.name, description: resource.description }),
    ]
    return { ...head, meta: [...head.meta, ...jsonLd] }
  },
  pendingComponent: () => <div className="min-h-dvh bg-[color:var(--bg-canvas)]" aria-busy="true" />,
  component: FreeResourcePage,
})

function FreeResourcePage() {
  const { slug } = Route.useParams()
  const resource = useSuspenseQuery(freeResourceQueries.bySlug(slug)).data
  // The loader guarantees a row; a cache eviction mid-session would refetch the same row.
  return <FreeResourceView key={slug} resource={resource} />
}
