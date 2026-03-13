import { exploreFeatureFlags } from '@/features/explore/config/explore-feature-flags';
import { ExploreComingSoon } from '@/features/explore/components/explore-coming-soon';
import { ExploreShell } from '@/features/explore/components/explore-shell';
import { trackActivity } from '@/utils/helpers/activity/tracking';
import { useEffect } from 'react';

export const metadata = {
  title: 'Explore – Organic Sonics',
  description: 'Personalized discovery, producer news, and resources.',
};

export default function ExplorePage() {
  useEffect(() => {
    trackActivity({
      eventType: "explore_viewed",
    });
  }, []);

  if (!exploreFeatureFlags.explorePageEnabled) {
    return <ExploreComingSoon />;
  }

  return <ExploreShell flags={exploreFeatureFlags} />;
}
