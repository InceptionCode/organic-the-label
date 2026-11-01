import { useEffect, useRef } from 'react'
import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { useFocusOnClientNav } from '~/lib/use-client-nav-focus'
import { Button } from '~/ui/button'
import { cn } from '~/ui/cn'

const textLink = cn(
  'link-underline inline-flex min-h-11 items-center rounded-sm text-body-m text-primary outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]',
)

/** Flat 500, same layout as the 404: decorative "500", the existing copy, "Try again" and a home link. */
export function ErrorPage({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const headingRef = useRef<HTMLHeadingElement>(null)
  useFocusOnClientNav(headingRef)

  useEffect(() => {
    console.error(error)
  }, [error])

  const retry = () => {
    reset()
    void router.invalidate()
  }

  return (
    <section data-testid="error-page" className="content-container flex min-h-[60dvh] flex-col justify-center pt-16 pb-20 md:pt-24 md:pb-28">
      <p aria-hidden className="select-none font-heading text-[clamp(7rem,30vw,24rem)] leading-[0.78] tracking-[0.01em] text-[color:var(--accent-primary)]">
        500
      </p>
      <div className="hairline-t mt-8 grid gap-8 pt-8 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <h1 ref={headingRef} tabIndex={-1} className="text-h1 text-primary text-balance outline-none">
            WOOAAAH YEAH I DID SOMETHING WRONG!
          </h1>
          <p className="mt-4 max-w-[48ch] text-body-l text-secondary">Or maybe it was you! Please refresh and try again!</p>
          <p className="mt-2 text-label">Error code: 500</p>
          {import.meta.env.DEV && error instanceof Error ? (
            <pre className="mt-6 max-w-full overflow-auto whitespace-pre-wrap break-words border-l-2 border-[color:var(--accent-primary)] bg-surface-1 p-4 font-mono text-sm text-secondary">
              Error details: {error.message}
            </pre>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 lg:col-span-5 lg:justify-end lg:self-end">
          <Button size="lg" onClick={retry}>
            Try again
          </Button>
          <Link to="/" className={textLink}>
            Back to home
          </Link>
        </div>
      </div>
    </section>
  )
}
