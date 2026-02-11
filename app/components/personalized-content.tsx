'use client';

import { RawSearchParams, getNormalizedSearchParams } from '@/lib/product/normalize-search-params';
import { useAuthStore } from '@/store/auth-context';
import MembershipContent from './membership-content';
import Recommendations from './recommendations';

export default async function PersonalizedContent({
  searchParams,
}: {
  searchParams: RawSearchParams | Promise<RawSearchParams>;
}) {
  const user = useAuthStore((state) => state.user);
  const normalizedSearchParams = getNormalizedSearchParams(await searchParams);

  return (
    <>
      {/* Render Membership content (including upsell) */}
      <MembershipContent user={user} />
      {/* Render user content (recommendations, deals, and saved personalized data per user including anon data */}
      <Recommendations user={user} />
    </>
  );
}
