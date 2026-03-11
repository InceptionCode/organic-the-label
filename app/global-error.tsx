'use client';

import '@/app/styles/globals.css';

import { inter, geistSans, geistMono } from '@/lib/font-tags';

import { ThemeProvider } from 'next-themes';
import { Footer } from './components/footer';
import { Button } from '@/ui-components/button';
import { Header } from '@/app/components/header';

import Image from 'next/image';

// Error boundaries must be Client Components

export default function GlobalError({
  error,
}: {
  error: Error & { errorMessage?: string; errorCode?: string | number };
}) {
  console.error(error);

  return (
    // global-error must include html and body tags
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} ${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white min-h-screen flex flex-col items-center`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <main className="flex-1 justify-center items-center gap-4 px-4 md:px-12 py-8 max-w-7xl mx-auto w-full">
            <Header />
            <div className="flex self-center items-center gap-4 py-16">
              <Image
                src="/warning-error.svg"
                alt="Browser error logo"
                width={100}
                height={50}
                priority
              />
              <h1 className="text-5xl">WOOAAAH YEAH I DID SOMETHING WRONG!</h1>
            </div>
            <p className="text-2xl text-gray-500 dark:text-gray-400 pb-4">
              Or maybe it was you! Please refresh and try again!
            </p>
            <div className="pb-8 text-gray-500 dark:text-gray-400 sm:w-[50%]">
              <p className="text-sm">Error Code: {error.errorCode || 500}</p>
              <div className="bg-gray-500 dark:bg-gray-400 p-6 rounded-b-lg overflow-auto">
                <p className="font-bold text-white text-pretty">
                  Error details: {error.errorMessage || error.message}
                </p>
              </div>
            </div>
            <Button onClick={() => window.location.reload()}>Try again</Button>
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
