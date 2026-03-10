import type { ExploreSectionMetadata } from '@/features/explore/types';
import { ExploreEmailSignupForm } from './explore-email-signup-form';

type ExploreEmailSignupProps = {
  metadata: ExploreSectionMetadata;
};

export function ExploreEmailSignup({ metadata }: ExploreEmailSignupProps) {
  return (
    <div className="card-base rounded-xl p-6 md:p-8" style={{ boxShadow: 'var(--shadow-md-premium)' }}>
      <h2 id={`${metadata.id}-heading`} className="text-h3 text-primary font-semibold mb-2">
        Join the list
      </h2>
      <p className="text-body-m text-muted mb-6 max-w-xl">
        Get tips, early access to drops, and optional personalization so we can surface what matters to you.
      </p>
      <ExploreEmailSignupForm />
    </div>
  );
}
