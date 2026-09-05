import type { Metadata } from 'next';
import NewsletterSignupForm from './newsletter-signup-form';

export const metadata: Metadata = {
  title: 'Newsletter – Organic Sonics',
  description:
    'Join the Organic Sonics newsletter for early access to new drops, free samples, and exclusive deals — straight to your inbox.',
};

const BENEFITS = [
  {
    title: 'New drops first',
    body: 'Previews and full downloads reach your inbox before they hit the feed.',
  },
  {
    title: 'Free samples and loops',
    body: 'Subscriber-only sample packs and works in progress a few times a season.',
  },
  {
    title: 'Exclusive deals',
    body: 'Store codes that only go out to the list. No spam, ever.',
  },
];

export default function NewsletterPage() {
  return (
    <main className="w-full">
      <div className="content-container py-12 md:py-16">
        <p className="eyebrow mb-3" style={{ color: 'var(--accent-secondary)' }}>
          Organic Sonics
        </p>
        <h1
          className="mb-4 leading-none text-primary"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            letterSpacing: '0.02em',
          }}
        >
          The newsletter
        </h1>
        <p className="mb-10 max-w-xl text-body-m text-muted">
          One email when there is something worth opening — new sounds, notes from the studio, and
          codes for the list. Unsubscribe anytime.
        </p>

        <div className="grid gap-10 md:grid-cols-[1fr_minmax(0,380px)] md:gap-16">
          <ul className="space-y-6">
            {BENEFITS.map((benefit) => (
              <li
                key={benefit.title}
                className="border-l-2 border-[color:var(--accent-primary)] pl-4"
              >
                <p className="text-h5 text-primary">{benefit.title}</p>
                <p className="mt-1 text-body-s text-secondary">{benefit.body}</p>
              </li>
            ))}
          </ul>

          <NewsletterSignupForm />
        </div>
      </div>
    </main>
  );
}
