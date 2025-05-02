'use client';

import { useAuthStore } from '@/store/auth-context';
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
import { useStorage } from '@/utils/hooks/use-storage';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const { setStorage, initItem: initCTAFlag } = useStorage('session', 'showSignUpCTA', {
    initMethod: 'get',
    item: 'true',
  });

  const onConfirm = () => {
    router.push('/login');
    setStorage('session', 'showSignUpCTA', 'false');
  };

  const onClose = () => {
    setOpen(false);
    setStorage('session', 'showSignUpCTA', 'false');
  };

  const [open, setOpen] = useState<boolean>();

  useEffect(() => {
    const showSignUpCTA = initCTAFlag === 'true';
    const defaultOpen = showSignUpCTA && (!user || user?.isAnon);

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

        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="list-inside list-decimal text-sm/6 text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2 tracking-[-.01em]">
            Get started by editing{' '}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
              app/page.tsx
            </code>
            .
          </li>
          <li className="tracking-[-.01em]">Save and see your changes instantly.</li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/file.svg" alt="File icon" width={16} height={16} />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/window.svg" alt="Window icon" width={16} height={16} />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/globe.svg" alt="Globe icon" width={16} height={16} />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
