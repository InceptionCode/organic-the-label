import { Suspense } from 'react';
import { FeaturedKits } from '@/app/components/featured-kits';
import HomeClient from '@/app/components/home-client';
import { LoadingState } from '@/ui-components';

export default function Home() {
  return (
    <HomeClient
      featuredSection={
        <Suspense fallback={<LoadingState variant='skeleton' />}>
          <FeaturedKits />
        </Suspense>
      }
    />
  );
}
