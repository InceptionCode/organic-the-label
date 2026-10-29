import { BadgeCheck } from 'lucide-react'
import { BIO } from '~/lib/work-with-me-content'
import { cn } from '~/ui/cn'
import { FlatHeading } from './flat-heading'

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]'

/** Bio as two columns: heading and verified label on the left, the story on the right. */
export function BioRow({ verified }: { verified: boolean }) {
  return (
    <section aria-labelledby="wwm-bio-title" className="content-container section-y-standard">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <FlatHeading id="wwm-bio-title" title={BIO.heading} />
          {verified ? (
            <p className="mt-5 inline-flex items-center gap-2 text-label">
              <BadgeCheck className="size-4 text-[color:var(--text-secondary)]" aria-hidden="true" />
              Verified artist on Spotify
            </p>
          ) : null}
        </div>

        <div className="lg:col-span-7 lg:col-start-6">
          <div className="flex flex-col gap-5">
            {BIO.paragraphs.map((paragraph) => (
              <p key={paragraph} className="max-w-[68ch] text-body-l text-secondary">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="mt-10 border-l border-[color:var(--border-strong)] pl-5">
            <p className="text-label">The platform</p>
            <p className="mt-2 max-w-[64ch] text-body-s leading-[1.7] text-secondary">{BIO.platformNote}</p>
          </div>
          <a
            href="#work-with-me-inquiry"
            className={cn('link-underline mt-8 inline-flex min-h-11 items-center rounded-sm text-body-m text-primary', focusRing)}
          >
            {BIO.ctaLabel}
          </a>
        </div>
      </div>
    </section>
  )
}
