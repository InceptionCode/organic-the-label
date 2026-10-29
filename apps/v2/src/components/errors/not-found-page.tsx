import { useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { useFocusOnClientNav } from '~/lib/use-client-nav-focus'
import { ButtonLink } from '~/ui/button'
import { cn } from '~/ui/cn'

const textLink = cn(
  'link-underline inline-flex min-h-11 items-center rounded-sm text-body-m text-primary outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]',
)

/**
 * Flat 404: an oversized Bebas "404" as the page's graphic (decorative), the existing heading and line,
 * then "Back to home" and a "Browse the store" text link. The clip-art /404-error.svg is no longer
 * rendered (it can't take the palette); the file stays in public/.
 */
export function NotFoundPage() {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useFocusOnClientNav(headingRef)

  return (
    <section data-testid="not-found-page" className="content-container flex min-h-[60dvh] flex-col justify-center pt-16 pb-20 md:pt-24 md:pb-28">
      <p aria-hidden className="select-none font-heading text-[clamp(7rem,30vw,24rem)] leading-[0.78] tracking-[0.01em] text-[color:var(--accent-primary)]">
        404
      </p>
      <div className="hairline-t mt-8 grid gap-8 pt-8 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <h1 ref={headingRef} tabIndex={-1} className="text-h1 text-primary text-balance outline-none">
            WOOAAAH I HAVE NO IDEA WHERE YOU&apos;RE AT!
          </h1>
          <p className="mt-4 max-w-[48ch] text-body-l text-secondary">Go ahead and turn around for me. This is the wrong way!</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 lg:col-span-5 lg:justify-end lg:self-end">
          <ButtonLink to="/" size="lg">
            Back to home
          </ButtonLink>
          <Link to="/store" className={textLink}>
            Browse the store
          </Link>
        </div>
      </div>
    </section>
  )
}
