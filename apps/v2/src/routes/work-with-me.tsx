import { noop } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { WorkWithMePage, WorkWithMePending } from '~/components/work-with-me/work-with-me-page'
import { PERSON_SAME_AS, SERVICES } from '~/lib/work-with-me-content'
import { workWithMeQueries } from '~/queries/work-with-me'
import { seo } from '~/seo/head'
import { breadcrumbJsonLd, personJsonLd } from '~/seo/jsonld'

export const Route = createFileRoute('/work-with-me')({
  codeSplitGroupings: [['component', 'pendingComponent'], ['errorComponent'], ['notFoundComponent']],
  loader: async ({ context }) => {
    const qc = context.queryClient
    // The hero needs the artist; recent posts stream in after the shell. Neither ever throws.
    const spotify = await qc.query(workWithMeQueries.spotify())
    void qc.query(workWithMeQueries.recentPosts()).catch(noop)
    return { artistImage: spotify.artist?.imageUrl ?? null }
  },
  head: ({ loaderData }) => {
    const head = seo({
      title: 'Work With Me: Production and Mixing',
      description:
        'Work directly with JUICEMAN on custom production, beats, mixing and mastering, and collaboration for Hip-Hop, Trap, and R&B. Powered by Organic Sonics.',
      path: '/work-with-me',
    })
    const jsonLd = [
      breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Work With Me', path: '/work-with-me' },
      ]),
      personJsonLd({
        name: 'JUICEMAN',
        jobTitle: 'Music producer',
        path: '/work-with-me',
        imageUrl: loaderData?.artistImage,
        sameAs: PERSON_SAME_AS,
        knowsAbout: SERVICES.map((s) => s.title),
      }),
    ]
    return { ...head, meta: [...head.meta, ...jsonLd] }
  },
  pendingComponent: WorkWithMePending,
  component: WorkWithMePage,
})
