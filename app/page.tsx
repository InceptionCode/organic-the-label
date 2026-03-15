'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui-components';
import useSafeParseUser from '@/utils/hooks/use-safe-parse-user';
import { useStorage } from '@/utils/hooks/use-storage';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { trackActivity } from '@/utils/helpers/activity/tracking';
import { defaultUserState } from '@/lib/store/auth-store';

export default function Home() {
  const router = useRouter();
  const user = useSafeParseUser(defaultUserState);

  const { setStorage, initItem: initCTAFlag } = useStorage('session', 'showSignUpCTA', {
    initMethod: 'get',
    item: 'true',
  });

  const onConfirm = () => {
    router.push('/signup');
    setStorage('session', 'showSignUpCTA', 'false');
  };

  const onClose = () => {
    setOpen(false);
    setStorage('session', 'showSignUpCTA', 'false');
  };

  const [open, setOpen] = useState<boolean>();

  useEffect(() => {
    trackActivity({
      eventType: "homepage_viewed",
    });
  }, []);

  useEffect(() => {
    const showSignUpCTA = initCTAFlag === 'true';
    const defaultOpen = showSignUpCTA && (!user || user?.is_anon);

    setOpen(defaultOpen);
  }, [initCTAFlag, user]);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Dialog open={open}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <ExclamationTriangleIcon aria-hidden="true" className="size-6 text-yellow-600" />
              <DialogTitle>Start Free Membership</DialogTitle>
            </DialogHeader>
            <DialogDescription className="text-black font-semibold text-center">
              Sign up and receive exclusive content, discounts and{' '}
              <span className="font-bold">more...</span>
            </DialogDescription>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  variant="secondary"
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-xs ring-1 ring-gray-300 ring-inset hover:cursor-pointer sm:mt-0 sm:w-auto"
                  onClick={onClose}
                >
                  Close
                </Button>
              </DialogClose>

              <Button
                type="button"
                onClick={() => onConfirm()}
                className="inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-xs sm:ml-3 sm:w-auto hover:cursor-pointer"
              >
                Signup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <p className="text-4xl font-bold text-center">This is Organic Sonics!</p>
        <p className="text-xl">
          A platform for music producers to level up their craft and sound. We&apos;re here to help you get the most out of your music production journey. Discover new tools, resources, and community to help you level up your sound.
        </p>
        <p className="text-2xl text-center">
          Join our community to get exclusive content, discounts and more...
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild variant="default">
            <Link href="/signup" className="text-h5 text-primary hover:text-secondary transition-soft line-clamp-2">
              Join the community
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/store" className="text-h5 text-primary hover:text-secondary transition-soft line-clamp-2">
              Browse the store
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
