import { createFileRoute } from '@tanstack/react-router'
import { ContactForm } from '~/components/contact/contact-form'
import { CONTACT_TITLE, ContactIntro } from '~/components/contact/contact-header'
import { SplitFormPage } from '~/components/forms/split-form-page'
import { validateContactSearch } from '~/lib/contact-prefill'
import { seo } from '~/seo/head'
import { CDN_TAG, publicPageHeaders } from '~/server/http/cache-headers'

// Static page; the form is the only interactive island (pages/contact.md).
export const Route = createFileRoute('/contact')({
  codeSplitGroupings: [['component'], ['errorComponent'], ['notFoundComponent']],
  // Anonymous HTML is CDN-cached; the cache guard makes it private whenever it could be per-visitor (phase 07.3).
  headers: () => publicPageHeaders([CDN_TAG.products]),
  // Optional prefill (category, subject, message, order), e.g. from an owned product's "Request access".
  validateSearch: validateContactSearch,
  head: () =>
    seo({
      title: 'Contact',
      description:
        'Contact Organic Sonics about an order, a download, licensing, or a collaboration. Send a message and we will get back to you as soon as possible.',
      path: '/contact',
    }),
  component: ContactPage,
})

// Split layout on the canvas (design-direction.md "Forms"). The v1 glow backdrop (ContactBackdrop)
// and the rounded card are no longer rendered.
function ContactPage() {
  const prefill = Route.useSearch()
  return (
    <SplitFormPage title={CONTACT_TITLE} intro={<ContactIntro />}>
      {/* Keyed by the prefill so a new prefilled link re-seeds the (uncontrolled) form. */}
      <ContactForm key={JSON.stringify(prefill)} prefill={prefill} />
    </SplitFormPage>
  )
}
