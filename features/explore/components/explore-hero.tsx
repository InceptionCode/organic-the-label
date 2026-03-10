import Link from 'next/link';
import { Button } from '@/ui-components/button';
import type { ExploreSectionMetadata } from '@/features/explore/types';

type ExploreHeroProps = {
  metadata: ExploreSectionMetadata;
};

export function ExploreHero({ metadata }: ExploreHeroProps) {
  return (
    <div
      className="card-base rounded-xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
      style={{ boxShadow: 'var(--shadow-md-premium)' }}
    >
      <div className="space-y-2 flex-1">
        <h2 id={`${metadata.id}-heading`} className="text-h3 md:text-h2 text-primary font-semibold">
          Your personalized explore
        </h2>
        <p className="text-body-m text-muted max-w-xl">
          Get updates, tailor your feed, and unlock more with membership.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 shrink-0">
        <Button asChild size="lg">
          <Link href="/signup">Get updates</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/store">Browse store</Link>
        </Button>
      </div>
    </div>
  );
}
