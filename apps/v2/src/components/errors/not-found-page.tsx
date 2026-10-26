import { ButtonLink } from '~/ui/button'

// Phase 04 baseline: real 404 status plus noindex (set by the root notFound head). The full v1
// parity layout (illustration, store link, focus on client navigation) lands in phase 05.
export function NotFoundPage() {
  return (
    <section className="content-container section-wrapper flex min-h-[60dvh] max-w-3xl flex-col gap-6">
      <h1 className="font-heading text-[clamp(2rem,7vw,3.5rem)] leading-none">
        WOOAAAH I HAVE NO IDEA WHERE YOU&apos;RE AT!
      </h1>
      <p className="text-body-l text-secondary">Go ahead and turn around for me. This is the wrong way!</p>
      <div>
        <ButtonLink to="/">Back to home</ButtonLink>
      </div>
    </section>
  )
}
