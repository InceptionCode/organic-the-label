import { Suspense } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { workWithMeQueries } from '~/queries/work-with-me'
import { RevealSection } from '~/ui/reveal-section'
import { ArtistLinks } from './artist-links'
import { BioRow } from './bio-row'
import { FeaturedTracks } from './featured-tracks'
import { Hero } from './hero'
import { InquiryForm } from './inquiry-form'
import { PlacementsGrid } from './placements-grid'
import { RecentPosts } from './recent-posts'
import { ServicesList } from './services-list'

/**
 * Section order from v1, flattened (design-direction.md, Work With Me). Unmounted in the redesign
 * (files kept): AmbientBackground (red glow washes), Marquee (services ticker; the services index
 * replaces it), CtaBand (merged into the inquiry section). CTAs are plain #work-with-me-inquiry links.
 */
export function WorkWithMePage() {
  const { data } = useSuspenseQuery(workWithMeQueries.spotify())
  return (
    <div className="wwm-page relative w-full overflow-x-clip bg-canvas">
      <Hero artist={data.artist} />
      <RevealSection threshold={0.08} distance={40}>
        <BioRow verified={data.artist !== null} />
      </RevealSection>
      <RevealSection threshold={0.08} distance={40}>
        <PlacementsGrid placements={data.placements} />
      </RevealSection>
      <RevealSection threshold={0.08} distance={40}>
        <ArtistLinks />
      </RevealSection>
      <Suspense fallback={null}>
        <RevealSection threshold={0.08} distance={40}>
          <RecentPosts />
        </RevealSection>
      </Suspense>
      <RevealSection threshold={0.08} distance={40}>
        <ServicesList />
      </RevealSection>
      <FeaturedTracks releases={data.releases} />
      <RevealSection threshold={0.06} distance={40}>
        <InquiryForm />
      </RevealSection>
    </div>
  )
}

/** Client-navigation pending state: the hero frame at its final size, so nothing shifts. */
export function WorkWithMePending() {
  return (
    <div className="relative w-full bg-canvas" aria-busy="true">
      <div className="hairline-b md:min-h-[calc(100svh-4rem)] lg:min-h-[calc(100svh-72px)]">
        <div className="content-container flex min-h-[600px] flex-col justify-end gap-6 pb-12 md:min-h-[calc(100svh-4rem)] lg:min-h-[calc(100svh-72px)]">
          <div className="h-32 w-full max-w-2xl animate-pulse bg-surface-2 motion-reduce:animate-none" />
          <div className="hairline-t flex items-end justify-between gap-6 pt-6">
            <div className="h-14 w-full max-w-lg animate-pulse bg-surface-2 motion-reduce:animate-none" />
            <div className="h-14 w-44 shrink-0 animate-pulse rounded-sm bg-surface-2 motion-reduce:animate-none" />
          </div>
        </div>
      </div>
    </div>
  )
}
