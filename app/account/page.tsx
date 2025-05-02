'use client';

import { useAuthStore } from '../../store/auth-context';
import { Button } from '@/ui-components';
import { signOutAction } from '../api/auth/sign-out';
import { Card, CardDescription, CardHeader, CardTitle } from '@/ui-components/card';

import { ShieldExclamationIcon } from '@heroicons/react/24/outline';
import isEmpty from 'lodash/isEmpty';
// TODO: Finish designing account page
// NOTE: Provide a way to edit user info (password, email, username, avatar_link) - make sure updates happen on a supabase browser client.
export default function Account() {
  const user = useAuthStore((state) => state.user);

  return (
    <div>
      {isEmpty(user?.confirmed_at) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">
              <ShieldExclamationIcon className="size-10 inline-flex pr-2" />
              Confirm Account!
            </CardTitle>
            <CardDescription>Please check email and confirm your account email</CardDescription>
          </CardHeader>
        </Card>
      )}
      Account page for {user?.username}: - change username - change email - change password - view
      subscription - view and track purchases
      <Button onClick={signOutAction}>Sign Out</Button>
    </div>
  );
}
