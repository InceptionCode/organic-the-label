import Link from 'next/link';
import { Button } from '@/ui-components';

const BENEFITS = [
  'Early access to new drops',
  'Free samples and loops',
  'Exclusive deals — straight to your inbox',
  'No spam, ever',
];

export default function CompositionHeader() {
  return (
    <header className="mb-10 flex flex-col gap-8 border-b border-subtle pb-10 md:mb-12 md:flex-row md:items-end md:justify-between md:gap-12">
      <div className="max-w-xl">
        <p className="eyebrow mb-3" style={{ color: 'var(--accent-secondary)' }}>
          Organic Sonics — Free loops
        </p>
        <h1
          className="mb-4 leading-none text-primary"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2.75rem, 6vw, 4.5rem)',
            letterSpacing: '0.02em',
          }}
        >
          Composition
        </h1>
        <p className="text-body-m text-muted">
          Original sample and loop previews straight from Instagram and YouTube. Hear the idea in
          context, then download the full loop with its terms of use as one zip — no account, no
          redirect.
        </p>
      </div>

      <aside className="w-full shrink-0 rounded-lg border border-subtle bg-surface-1 p-5 shadow-sm-premium md:max-w-xs">
        <p
          className="mb-3 text-h5 text-primary"
          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.02em' }}
        >
          Get loops in your inbox
        </p>
        <ul className="mb-5 space-y-2">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex gap-2.5 text-body-s text-secondary">
              <span
                aria-hidden
                className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[color:var(--accent-primary)]"
              />
              {benefit}
            </li>
          ))}
        </ul>
        <Button asChild size="lg" className="w-full">
          <Link href="/newsletter">Join the newsletter</Link>
        </Button>
      </aside>
    </header>
  );
}
