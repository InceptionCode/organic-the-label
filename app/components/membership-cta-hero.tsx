import Link from 'next/link';
import { Button } from '@/ui-components';
import { DismissMembershipCtaButton } from '@/app/components/dismiss-membership-cta-button';

export function MembershipCtaHero() {
  return (
    <section
      aria-labelledby="membership-cta-heading"
      className="content-container mb-8"
    >
      <div
        className="card-base rounded-xl bg-[color:var(--surface-1)] border border-subtle p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
        style={{ boxShadow: 'var(--shadow-md-premium)' }}
      >
        <div className="space-y-2 flex-1">
          <h2
            id="membership-cta-heading"
            className="text-h4 md:text-h3 text-primary font-semibold"
          >
            Unlock member pricing, reward points, and exclusive drops.
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/signup">Sign up</Link>
          </Button>
          <DismissMembershipCtaButton />
        </div>
      </div>
    </section>
  );
}
