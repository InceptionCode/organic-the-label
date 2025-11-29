import { getUserAction } from '@/app/api/auth/get-user';

import { defaultUserState } from '@/lib/store/auth-store';
import { User } from '@/lib/schemas';

import { AuthStoreProvider } from './auth-context';

export default async function InitAuthStore({ children }: { children: React.ReactNode }) {
  const userActionState: Awaited<ReturnType<typeof getUserAction>> = await getUserAction();
  const initialUser: User = userActionState.user ?? defaultUserState;

  return <AuthStoreProvider initialUser={initialUser}>{children}</AuthStoreProvider>;
}
