'use client';

import '@/app/styles/globals.css';

import { inter, geistSans, geistMono } from '@/lib/font-tags';

import { ThemeProvider } from 'next-themes';
import { Button } from '@/ui-components/button';

import Image from 'next/image';
import { AuthStoreProvider } from '@/store/auth-context';
import { useGetUser } from '@/utils/hooks/use-get-user';

// Error boundaries must be Client Components

export default function NotFound() {
  const initialUser = useGetUser();

  return (
    // global-error must include html and body tags
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} ${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white min-h-screen flex flex-col items-center`}
      >
        <AuthStoreProvider initialUser={initialUser}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
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
          </ThemeProvider>
        </AuthStoreProvider>
      </body>
    </html>
  );
}
