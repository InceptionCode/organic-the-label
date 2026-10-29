import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { FreeResourceView } from '~/components/free/free-resource-view'
import { FREE_DESCRIPTION, freeIndexTitle } from '~/lib/free-seo'
import { freeResourceQueries } from '~/queries/free-resources'
import { seo } from '~/seo/head'
import { breadcrumbJsonLd, freeResourceJsonLd } from '~/seo/jsonld'

export const Route = createFileRoute('/free/')({
  codeSplitGroupings: [['component', 'pendingComponent'], ['errorComponent'], ['notFoundComponent']],
  // A null resource is valid: the view renders v1's default starter kit copy with a 200.
  loader: async ({ context }) => ({ resource: await context.queryClient.query(freeResourceQueries.featured()) }),
  head: ({ loaderData }) => {
    const resource = loaderData?.resource ?? null
    const head = seo({ title: freeIndexTitle(resource?.name), description: FREE_DESCRIPTION, path: '/free' })
    const jsonLd = [
      breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Free', path: '/free' },
      ]),
      ...(resource ? [freeResourceJsonLd({ slug: resource.slug, name: resource.name, description: resource.description })] : []),
    ]
    return { ...head, meta: [...head.meta, ...jsonLd] }
  },
  pendingComponent: () => <div className="min-h-dvh bg-[color:var(--bg-canvas)]" aria-busy="true" />,
  component: FreePage,
})

function FreePage() {
  const resource = useSuspenseQuery(freeResourceQueries.featured()).data
  return <FreeResourceView resource={resource} />
}
