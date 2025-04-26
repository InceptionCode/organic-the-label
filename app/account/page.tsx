'use client';

import { use } from 'react';
import { useAuthStore } from '../../store/auth-context';
// NOTE: Provide a way to edit user info (password, email, username, avatar_link) - make sure updates happen on a supabase browser client.
export default function Account({ params }: { params: Promise<{ id: string }> }) {
  const { id: userid } = use(params);
  const user = useAuthStore((state) => state.user);
  // TODO: If new user (or user has not confirmed Email) Present banner across the top of the page. That asks the user to confirm email.
  // TODO: Add signout button
  return (
    <div>
      Account page for {userid}: - change username - change email - change password - view
      subscription - view and track purchases
    </div>
  );
}
