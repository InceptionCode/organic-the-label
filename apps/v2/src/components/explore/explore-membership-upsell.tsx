import { ComingSoonBadge } from '~/components/membership/coming-soon-badge'
import { membershipEnabled } from '~/lib/feature-flags'
import { ButtonLink } from '~/ui/button'
import type { ExploreSectionMetadata } from './explore-sections'

const BENEFITS = ['Exclusive advice and tips', 'Educational videos', 'Reward points and deals', 'Early access to new resources']

const inkButton =
  'mt-10 w-full bg-[color:var(--band-sand-fg)] text-[color:var(--band-sand-bg)] hover:bg-[color:var(--surface-3)] focus-visible:ring-[color:var(--band-sand-fg)] focus-visible:ring-offset-[color:var(--band-sand-bg)] sm:w-auto'

/**
 * v1 ExploreMembershipUpsell as the page's one sand band (same layout as Home's membership pitch):
 * heading, line and ink button on the left, benefits as hairline rows on the right.
 * Behind VITE_MEMBERSHIP_ENABLED (off by default): off renders a "coming soon" promo with the same
 * benefits and a newsletter CTA; on renders the original "Join membership" pitch.
 */
export function ExploreMembershipUpsell({ metadata }: { metadata: ExploreSectionMetadata }) {
  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-5">
        {/* Same label + badge as Home's membership promo. */}
        {!membershipEnabled && (
          <p className="mb-6 flex items-center gap-3 text-label">
            Membership
            <ComingSoonBadge />
          </p>
        )}
        <h2 id={`${metadata.id}-heading`} className="text-display-m">
          MORE FOR MEMBERS
        </h2>
        {membershipEnabled ? (
          <>
            <p className="mt-6 max-w-[44ch] text-body-l">
              Paid membership unlocks exclusive advice, tips, educational videos, reward points, and more.
            </p>
            <ButtonLink to="/signup" size="lg" className={inkButton}>
              Join membership
            </ButtonLink>
          </>
        ) : (
          <>
            <p className="mt-6 max-w-[44ch] text-body-l">
              Membership is coming soon. It will unlock exclusive advice, tips, educational videos, reward points, and more.
            </p>
            <ButtonLink to="/newsletter" size="lg" className={inkButton}>
              Get notified
            </ButtonLink>
          </>
        )}
      </div>

      <ul aria-label="Member benefits" className="grid content-start gap-x-8 sm:grid-cols-2 lg:col-span-6 lg:col-start-7">
        {BENEFITS.map((item) => (
          <li key={item} className="hairline-t py-4 text-body-m">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
