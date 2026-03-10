import Link from 'next/link';
import { Button } from '@/ui-components/button';
import type { ExploreSectionMetadata } from '@/features/explore/types';

type ExploreMembershipUpsellProps = {
  metadata: ExploreSectionMetadata;
};

const BENEFITS = [
  'Exclusive advice and tips',
  'Educational videos',
  'Reward points and deals',
  'Early access to new resources',
];

export function ExploreMembershipUpsell({ metadata }: ExploreMembershipUpsellProps) {
  return (
    <div className="card-base rounded-xl p-6 md:p-8" style={{ boxShadow: 'var(--shadow-md-premium)' }}>
      <h2 id={`${metadata.id}-heading`} className="text-h3 text-primary font-semibold mb-2">
        More for members
      </h2>
      <p className="text-body-m text-muted mb-6 max-w-xl">
        Paid membership unlocks exclusive advice, tips, educational videos, reward points, and more.
      </p>
      <ul className="space-y-2 mb-6" aria-label="Member benefits">
        {BENEFITS.map((item) => (
          <li key={item} className="text-body-m text-primary flex items-center gap-2">
            <span className="text-accent-primary" aria-hidden>✓</span>
            {item}
          </li>
        ))}
      </ul>
      <Button asChild size="lg">
        <Link href="/signup">Join membership</Link>
      </Button>
    </div>
  );
}
