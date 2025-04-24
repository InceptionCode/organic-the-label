'use client';

import { usePathname } from 'next/navigation';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { ProfileDropdown } from './profile-dropdown';
import { useAuthStore } from '@/store/auth-context';

/*
- Store link
- Logo home link
- Coding structure that supports dynamic links (pull potential static links from CDN) and dynamically generate those links.
Links will be flagged active 
- Conditional Sign In / Account button and link.
*/

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export const Header = () => {
  const pathname = usePathname();
  const isCurrent = (name: string) => pathname === `/${name}`;

  const user = useAuthStore((state) => state.user);

  const navLinks = [
    { name: 'Explore', href: '/', current: isCurrent('') }, // current value will come from props.
    { name: 'Store', href: '/store', current: isCurrent('store') },
    // dynamically include "active" links from CDN/server
  ];

  return (
    <header>
      <Disclosure as="nav" className="bg-transparent">
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center justify-between">
            <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
              {/* Mobile menu button*/}
              <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-hidden focus:ring-inset">
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Open main menu</span>
                <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
                <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
              </DisclosureButton>
            </div>
            <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
              <div className="flex shrink-0 items-center">
                <Link href="/">
                  <img
                    alt="Organic Label Company logo"
                    src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
                    className="h-14 w-auto"
                  />
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:block">
                <div className="flex space-x-4">
                  {navLinks.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      aria-current={item.current ? 'page' : undefined}
                      className={classNames(
                        item.current
                          ? 'border-b-2 border-red-500 text-white'
                          : 'text-gray-300 hover:text-white hover:border-b-2 hover:border-red-300',
                        'px-3 py-4 text-xl font-bold',
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
              <Link
                href="/search"
                type="button"
                className="relative p-1 text-gray-400 hover:cursor-pointer hover:text-white focus:text-white focus:outline-hidden"
              >
                <span className="absolute -inset-1.5" />
                <span className="sr-only">Search</span>
                <MagnifyingGlassIcon aria-hidden="true" className="size-6" />
              </Link>
              {user && !user.isAnon ? (
                <ProfileDropdown />
              ) : (
                <Link
                  href="/login"
                  className={classNames(
                    'text-gray-300 hover:text-white hover:border-b-2 hover:border-red-300',
                    'px-3 py-4 text-xl font-bold',
                  )}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>

        <DisclosurePanel className="sm:hidden">
          <div className="space-y-1 px-2 pt-2 pb-3">
            {navLinks.map((item) => (
              <DisclosureButton
                key={item.name}
                as="a"
                href={item.href}
                aria-current={item.current ? 'page' : undefined}
                className={classNames(
                  item.current
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                  'block rounded-md px-3 py-2 text-base font-medium',
                )}
              >
                {item.name}
              </DisclosureButton>
            ))}
          </div>
        </DisclosurePanel>
      </Disclosure>
    </header>
  );
};
