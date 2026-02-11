'use client';

import type { AuthStore } from '@/lib/store';

const MembershipUpsell = ({ user }: { user: AuthStore['user'] }) => {
  return (
    <p>
      {user?.username || 'Hey'} sign up for the membership and earn points towards and special
      deals. Plus, access to exclusive content.
    </p>
    /* add direct link to signup | make this a banner on screen that is dismissible */
  );
};

export default function MembershipContent({ user }: { user: AuthStore['user'] }) {
  return (
    <div className="bg-red-400 px-4 text-md font-bold">
      {user?.is_anon || !user?.is_member ? (
        <MembershipUpsell user={user} />
      ) : (
        <div>Membership content here....</div>
      )}
    </div>
  );
}
