import { Suspense } from 'react';
import { FeaturedKits } from '@/app/components/featured-kits';
import { LatestDrop } from '@/app/components/latest-drop';
import { StatsBar } from '@/app/components/stats-bar';
import HomeClient from '@/app/components/home-client';
import { LoadingState } from '@/ui-components';

export default function Home() {
  return (
    <HomeClient
      statsBarSection={<StatsBar />}
      featuredSection={
        <Suspense fallback={<LoadingState variant='skeleton' />}>
          <FeaturedKits />
        </Suspense>
      }
      latestDropSection={
        <Suspense fallback={<LoadingState variant='skeleton' />}>
          <LatestDrop />
        </Suspense>
      }
    />
  );
}
