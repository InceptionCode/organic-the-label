import { exploreFeatureFlags } from '@/features/explore/config/explore-feature-flags';
import { ExploreComingSoon } from '@/features/explore/components/explore-coming-soon';
import { ExploreShell } from '@/features/explore/components/explore-shell';

export const metadata = {
  title: 'Explore – Organic Sonics',
  description: 'Personalized discovery, producer news, and resources.',
};

export default function ExplorePage() {
  if (!exploreFeatureFlags.explorePageEnabled) {
    return <ExploreComingSoon />;
  }

  return <ExploreShell flags={exploreFeatureFlags} />;
}
