import { cookies } from 'next/headers';
import { getUserAction } from '@/app/api/auth/get-user';
import { checkMembershipCtaVisibility } from '@/lib/membership-cta/visibility';
import MembershipContent from './membership-content';
import Recommendations from './recommendations';
import { User } from '@/lib/schemas';

function shouldShowMembershipCta(user: { is_anon: boolean; is_member?: boolean } | null): boolean {
  if (!user) return true;
  const isAnon = user.is_anon;
  const isMember = user.is_member ?? false;
  return isAnon || !isMember;
}

export default async function PersonalizedContent() {
  const [userResult, cookieStore] = await Promise.all([
    getUserAction(),
    cookies(),
  ]);

  const user = userResult.user as User;
  const ctaVisible = checkMembershipCtaVisibility(cookieStore);
  const shouldShowCta = shouldShowMembershipCta(user) && ctaVisible;

  return (
    <>
      <MembershipContent shouldShowCta={shouldShowCta} />
      <Recommendations
        user={user ?? undefined}
      />
    </>
  );
}
