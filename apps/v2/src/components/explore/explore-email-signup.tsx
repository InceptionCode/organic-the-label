import { EmailSignupForm } from '~/components/home/email-signup-form'
import type { ExploreSectionMetadata } from './explore-sections'

/**
 * v1 explore "Join the list", flat on the canvas like Home's email signup (heading and line left, the
 * dark-tone form right), wired to the real newsletter service (source 'explore'), never a fake submit.
 */
export function ExploreEmailSignup({ metadata }: { metadata: ExploreSectionMetadata }) {
  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-5">
        <h2 id={`${metadata.id}-heading`} className="text-display-m text-primary">
          JOIN THE LIST
        </h2>
        <p className="mt-6 max-w-[44ch] text-body-l text-secondary">New drops, free samples, and studio notes, straight to your inbox.</p>
      </div>
      <div className="lg:col-span-6 lg:col-start-7">
        <EmailSignupForm source="explore" tone="dark" />
      </div>
    </div>
  )
}
