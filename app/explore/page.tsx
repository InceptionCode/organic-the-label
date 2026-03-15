import { exploreFeatureFlags } from '@/features/explore/config/explore-feature-flags';
import { ExploreComingSoon } from '@/features/explore/components/explore-coming-soon';
import { ExploreShell } from '@/features/explore/components/explore-shell';
import ExploreViewTracker from '@/app/explore/components/explore-page-tracker';
import { LoadingState } from '@/ui-components';
import { Suspense } from 'react';

export const metadata = {
  title: 'Explore – Organic Sonics',
  description: 'Personalized discovery, producer news, and resources.',
};

const ExploreLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <Suspense fallback={<LoadingState variant='skeleton' />}>
        <ExploreViewTracker />
      </Suspense>
      {children}
    </div>
  );
};

export default function ExplorePage() {
  if (!exploreFeatureFlags.explorePageEnabled) {
    return (
      <ExploreLayout>
        <ExploreComingSoon />
      </ExploreLayout>
    );
  }

  return (
    <ExploreLayout>
      <ExploreShell flags={exploreFeatureFlags} />
    </ExploreLayout>
  );
}
