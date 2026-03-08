'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dialog, DialogPanel } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { navLinks } from '@/lib/constants';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="sm:hidden p-2 rounded-md text-secondary hover:text-primary hover:bg-surface-2 transition-soft min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Open menu"
      >
        <Bars3Icon className="w-6 h-6" aria-hidden />
      </button>

      <Dialog open={open} onClose={setOpen} className="relative z-50 sm:hidden">
        <div className="fixed inset-0 bg-overlay-surface/90" aria-hidden="true" />
        <div className="fixed inset-0 flex justify-end">
          <DialogPanel className="w-full max-w-[280px] bg-surface-2 border-l border-subtle shadow-lg-premium flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-subtle">
              <span className="text-h5 text-primary">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-md text-secondary hover:text-primary hover:bg-surface-3 transition-soft"
                aria-label="Close menu"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex flex-col p-4 gap-1" aria-label="Mobile">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={pathname === link.href ? 'page' : undefined}
                  className={cn(
                    'text-body-m font-medium py-3 px-3 rounded-md transition-soft',
                    pathname === link.href ? 'text-primary bg-surface-3' : 'text-secondary hover:text-primary hover:bg-surface-3',
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="/search"
                onClick={() => setOpen(false)}
                className="text-body-m font-medium py-3 px-3 rounded-md text-secondary hover:text-primary hover:bg-surface-3 transition-soft"
              >
                Search
              </Link>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="text-body-m font-medium py-3 px-3 rounded-md text-secondary hover:text-primary hover:bg-surface-3 transition-soft mt-2"
              >
                Login
              </Link>
            </nav>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
