'use client';

import { useRouter } from 'next/navigation';
import { signOutAction } from '@/app/api/auth/signout';

export default function useSignOut() {
  const router = useRouter();

  // NOTE: In the future once CSS is hooked up add error handling logic to present toast message or whatever
  const signOutHandler = async () => {
    const { ok } = await signOutAction();
    if (ok) router.push('/');
  };

  return { signOutHandler };
}