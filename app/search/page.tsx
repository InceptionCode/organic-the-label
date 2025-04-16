'use client'

import Dialog from "@/ui-components/dialog"
import { TextField } from "@/ui-components/text-field";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export default function Search () {
  const router = useRouter()
    return (
        <div className="grid grid-rows-[20px_1fr_20px] justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
          <main className="flex flex-col gap-[32px] row-start-2 sm:items-start">
            <Dialog isOpen onClose={router.back}>
                <form className="flex">
                  <TextField placeholder="Search..." leftIcon={<MagnifyingGlassIcon aria-hidden="true" className="size-8" />} />
                </form>
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