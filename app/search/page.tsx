'use client';

import { Dialog, DialogContent, DialogOverlay, DialogTitle } from '@/ui-components/dialog';
import { TextField, Button } from '@/ui-components';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Search() {
  const router = useRouter();

  const [search, setSearch] = useState<string>('');

  return (
    <div className="grid grid-rows-[20px_1fr_20px] min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 sm:items-start">
        <Dialog defaultOpen onOpenChange={router.back}>
          <DialogOverlay>
            <VisuallyHidden>
              <DialogTitle />
            </VisuallyHidden>
            <DialogContent
              className="h-[calc(100%-24rem)] sm:max-w-6xl overflow-auto"
              hasClose={false}
            >
              <form className="flex gap-4 pt-8">
                <TextField
                  className="text-black"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.currentTarget.value)}
                  leftIcon={<MagnifyingGlassIcon aria-hidden="true" className="size-8" />}
                />
                <Button
                  className="disabled:bg-gray-500"
                  disabled={!search}
                  onClick={() => setSearch('')}
                >
                  CLEAR
                </Button>
              </form>
              {/* Search results populate here.... */}
              {/* NOTE: Include a default empty state that shows "product cards" and recent content */}
            </DialogContent>
          </DialogOverlay>
        </Dialog>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
