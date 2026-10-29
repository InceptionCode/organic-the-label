import { ComingSoonBadge } from '~/components/membership/coming-soon-badge'
import { MEMBERSHIP_BENEFITS } from '~/lib/constants'
import { membershipEnabled } from '~/lib/feature-flags'
import { ButtonLink } from '~/ui/button'

const inkButton =
  'mt-10 bg-[color:var(--band-sand-fg)] text-[color:var(--band-sand-bg)] hover:bg-[color:var(--surface-3)] focus-visible:ring-[color:var(--band-sand-fg)] focus-visible:ring-offset-[color:var(--band-sand-bg)]'

/**
 * Membership pitch: the page's one sand band. Marketing copy only. With VITE_MEMBERSHIP_ENABLED off
 * (the default) it is a "coming soon" promo: same heading and benefits, and the CTA asks for the
 * newsletter instead of a signup. With the flag on it renders the original pitch and /signup CTA.
 */
export function Membership() {
  return (
    <section aria-labelledby="membership-heading" className="band-sand section-y-standard">
      <div className="content-container grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          {membershipEnabled ? (
            <p className="mb-6 text-label">Membership</p>
          ) : (
            <p className="mb-6 flex items-center gap-3 text-label">
              Membership
              <ComingSoonBadge />
            </p>
          )}
          <h2 id="membership-heading" className="text-display-m">
            MORE THAN A STORE
          </h2>
          {membershipEnabled ? (
            <>
              <p className="mt-6 max-w-[44ch] text-body-l">
                Free membership gets you inside access: exclusive resources, reward points, and a community of serious
                producers.
              </p>
              <ButtonLink to="/signup" size="lg" className={inkButton}>
                Start free, no card needed
              </ButtonLink>
            </>
          ) : (
            <>
              <p className="mt-6 max-w-[44ch] text-body-l">
                Membership is coming soon: inside access to exclusive resources, reward points, and a community of serious
                producers. Join the newsletter to hear when it opens.
              </p>
              <ButtonLink to="/newsletter" size="lg" className={inkButton}>
                Get notified
              </ButtonLink>
            </>
          )}
        </div>

        <ul
          aria-label={membershipEnabled ? undefined : 'Coming with membership'}
          className="grid content-start gap-x-8 sm:grid-cols-2 lg:col-span-6 lg:col-start-7"
        >
          {MEMBERSHIP_BENEFITS.map((benefit) => (
            <li key={benefit} className="hairline-t py-4 text-body-m">
              {benefit}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
