import { membershipEnabled } from '~/lib/feature-flags'
import { useSession } from '~/lib/use-session'
import { ButtonLink } from '~/ui/button'
import type { ExploreSectionMetadata } from './explore-sections'

type ExploreHeroProps = {
  metadata: ExploreSectionMetadata
  /** Phase 09 seam: AI personalization ("Recommended for you") renders here for signed-in users. */
  personalized?: never
}

/**
 * v1 ExploreHero copy and buttons as a flat row under the page header: heading and line on the left,
 * the actions on the right. Signed-in users get "Your account" instead of "Get updates" (open decision 2).
 */
export function ExploreHero({ metadata }: ExploreHeroProps) {
  const session = useSession()
  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-10">
      <div>
        <h2 id={`${metadata.id}-heading`} className="text-h2 text-primary">
          YOUR PERSONALIZED EXPLORE
        </h2>
        <p className="mt-3 max-w-[52ch] text-body-m text-secondary">
          {/* Membership mention only while VITE_MEMBERSHIP_ENABLED is on; the sand band below carries the coming-soon promo. */}
          {membershipEnabled ? 'Get updates, tailor your feed, and unlock more with membership.' : 'Get updates and tailor your feed.'}
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {session ? (
          <ButtonLink to="/account" size="lg" className="w-full sm:w-auto">
            Your account
          </ButtonLink>
        ) : (
          <ButtonLink to="/signup" size="lg" className="w-full sm:w-auto">
            Get updates
          </ButtonLink>
        )}
        <ButtonLink to="/store" variant="outline" size="lg" className="w-full sm:w-auto">
          Browse store
        </ButtonLink>
      </div>
    </div>
  )
}
