
import { RawSearchParams, getNormalizedSearchParams } from '@/lib/product/normalize-search-params';
import MembershipContent from './membership-content';
import Recommendations from './recommendations';
import { defaultUserState } from '@/lib/store/auth-store';
import safeParseUser from '@/utils/helpers/safe-parse-uesr';

export default async function PersonalizedContent({
  searchParams,
}: {
  searchParams: RawSearchParams | Promise<RawSearchParams>;
}) {
  const user = safeParseUser(defaultUserState);

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
