'use client';

import '@/app/styles/globals.css';

import { Button } from '@/ui-components/button';

import Image from 'next/image';

// Error boundaries must be Client Components

export default function NotFound() {
  return (
    <main className="flex-1 justify-center items-center gap-4 px-4 md:px-12 py-8 max-w-7xl mx-auto w-full">
      <div className="flex self-center items-center gap-4 pt-16 pb-8">
        <Image src="/404-error.svg" alt="404 error logo" width={100} height={50} priority />
        <h1 className="text-4xl">WOOAAAH I HAVE NO IDEA WHERE YOU&apos;RE AT!</h1>
      </div>
      <p className="text-2xl text-gray-500 dark:text-gray-400 pb-4">
        Go ahead and turn around for me. This is the wrong way!
      </p>
      <Button onClick={() => window.location.replace('/')}>Go Back</Button>
    </main>
  );
}
