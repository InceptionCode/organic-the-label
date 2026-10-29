import { LazyEmailVisual } from '~/components/visuals/lazy'
import { LOGO_PATH } from '~/seo/site'
import { EmailSignupForm } from './email-signup-form'

/**
 * Email signup on the canvas. From lg: form in 5 columns (pushed toward the center), EmailVisual in 7
 * bleeding to the right edge. Below lg the visual is a shorter band above the form, fading into the canvas.
 */
export function EmailSignup() {
  return (
    <section aria-labelledby="email-signup-heading" className="hairline-t relative grid bg-canvas lg:min-h-[68svh] lg:grid-cols-12">
      <div
        aria-hidden="true"
        className="os-email-visual-mask relative h-[clamp(280px,64vw,440px)] overflow-hidden bg-canvas lg:order-2 lg:col-span-7 lg:h-auto"
      >
        <LazyEmailVisual
          className="absolute inset-0"
          intensity={2}
          glowAmount={2}
          contourDensity={8}
          depthAmount={1.5}
          cameraIntensity={0.6}
        />
      </div>

      <div className="relative z-10 -mt-12 flex flex-col justify-center px-6 pb-16 md:px-10 md:pb-24 lg:order-1 lg:col-span-5 lg:mt-0 lg:items-end lg:py-24 lg:pl-16 lg:pr-0 lg:-mr-12 xl:pl-24 xl:-mr-20">
        <div className="w-full lg:max-w-[34rem]">
          <img
            src={LOGO_PATH}
            alt="Organic Sonics"
            width={56}
            height={56}
            loading="lazy"
            decoding="async"
            className="mb-10 size-14 object-contain opacity-80 max-lg:hidden"
          />
          <p className="mb-6 text-label">Stay in the loop</p>
          <h2 id="email-signup-heading" className="text-display-m text-primary">
            GET FREE RESOURCES
          </h2>
          <p className="mb-10 mt-6 max-w-[44ch] text-body-m text-secondary">
            Early access to new drops, free samples, and exclusive deals, straight to your inbox. No spam, ever.
          </p>
          <EmailSignupForm source="footer" />
        </div>
      </div>
    </section>
  )
}
