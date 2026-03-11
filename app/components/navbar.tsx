'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from '@/ui-components';
import CartIconButton from './cart-icon-button';
import { MobileNav } from './mobile-nav';
import { ProfileDropdown } from './profile-dropdown';
import { defaultUserState } from '@/lib/store/auth-store';
import safeParseUser from '@/utils/hooks/use-safe-parse-user';
import { cn } from '@/lib/utils';
import { navLinks } from '@/lib/constants';

export function Navbar() {
  const pathname = usePathname();
  const user = safeParseUser(defaultUserState);

  return (
    <header className="sticky top-0 z-30 border-b border-subtle bg-canvas/95 backdrop-blur-sm">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MobileNav />
            <Link href="/" className="shrink-0 text-primary hover:text-secondary transition-soft">
              <span className="text-h4 font-semibold">Organic Sonics</span>
            </Link>
          </div>

          <nav className="hidden sm:flex items-center gap-8" aria-label="Main">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? 'page' : undefined}
                className={cn(
                  'text-body-m font-medium transition-soft',
                  pathname === link.href ? 'text-primary' : 'text-secondary hover:text-primary',
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <CartIconButton />
            <Link
              href="/search"
              className="p-2 rounded-md text-secondary hover:text-primary hover:bg-surface-2 transition-soft min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
            {user && !user.is_anon ? (
              <ProfileDropdown />
            ) : (
              <Link
                href="/login"
                className="text-body-m font-medium text-secondary hover:text-primary transition-soft px-3 py-2"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </Container>
    </header>
  );
}
