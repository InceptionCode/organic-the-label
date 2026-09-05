import { getUserAction } from '@/app/api/auth/get-user';
import { AuthStoreProvider } from './auth-context';

// Seeds AuthStoreProvider with a cookie-verified user fetched server-side.

export default async function InitAuthStore({ children }: { children: React.ReactNode }) {
  const { user } = await getUserAction();

  return <AuthStoreProvider initialUser={user}>{children}</AuthStoreProvider>;
}
