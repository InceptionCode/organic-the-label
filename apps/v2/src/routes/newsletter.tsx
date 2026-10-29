import { createFileRoute } from '@tanstack/react-router'
import { SplitFormPage } from '~/components/forms/split-form-page'
import { NEWSLETTER_BENEFITS } from '~/components/newsletter/newsletter-benefits'
import { NEWSLETTER_TITLE, NewsletterIntro } from '~/components/newsletter/newsletter-header'
import { NewsletterSignupForm } from '~/components/newsletter/newsletter-signup-form'
import { seo } from '~/seo/head'
import { CDN_TAG, publicPageHeaders } from '~/server/http/cache-headers'

// Static page. Viewing it creates no visitor; only a submit does (pages/newsletter.md).
export const Route = createFileRoute('/newsletter')({
  codeSplitGroupings: [['component'], ['errorComponent'], ['notFoundComponent']],
  // Anonymous HTML is CDN-cached; the cache guard makes it private whenever it could be per-visitor (phase 07.3).
  headers: () => publicPageHeaders([CDN_TAG.products]),
  head: () =>
    seo({
      title: 'Newsletter',
      description:
        'Join the Organic Sonics newsletter for early access to new drops, free samples, and exclusive deals, straight to your inbox.',
      path: '/newsletter',
    }),
  component: NewsletterPage,
})

// Split layout (design-direction.md "Forms"): mobile puts the form before the benefits.
function NewsletterPage() {
  return (
    <SplitFormPage title={NEWSLETTER_TITLE} intro={<NewsletterIntro />} points={NEWSLETTER_BENEFITS}>
      <div className="relative">
        <NewsletterSignupForm />
      </div>
    </SplitFormPage>
  )
}
