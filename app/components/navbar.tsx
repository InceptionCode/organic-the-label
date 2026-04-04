'use client';

import Link from 'next/link';
import Image from 'next/image';
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
    <header
      className="sticky top-0 z-30 backdrop-blur-md"
      style={{
        background: 'rgba(23, 23, 23, 0.88)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <MobileNav />
            <Link
              href="/"
              className="shrink-0 flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] rounded"
              aria-label="Organic Sonics — home"
            >
              <Image
                src="/brand-assets/organic-sonics-logo.png"
                alt="Organic Sonics"
                width={42}
                height={42}
                className="object-contain"
                priority
              />
              <span
                className="text-primary hidden sm:block"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.5rem',
                  letterSpacing: '0.05em',
                }}
              >
                ORGANIC SONICS
              </span>
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-8" aria-label="Main">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <div key={link.href} className="relative flex flex-col items-center">
                  <Link
                    href={link.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'font-medium transition-soft',
                      isActive ? 'text-primary' : 'text-muted hover:text-primary',
                    )}
                    style={{ letterSpacing: '0.08em', fontSize: '0.7rem', textTransform: 'uppercase' }}
                  >
                    {link.name}
                  </Link>
                  {isActive && (
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute',
                        bottom: '-10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: 'var(--accent-primary)',
                        boxShadow: '0 0 6px 2px rgba(224,61,42,0.75)',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            <CartIconButton />
            <Link
              href="/search"
              className="p-2.5 rounded-md text-muted hover:text-primary hover:bg-surface-2 transition-soft min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
            {user && !user.is_anon ? (
              <ProfileDropdown />
            ) : (
              <Link
                href="/login"
                className="text-muted hover:text-primary transition-soft px-3 py-2 rounded-md hover:bg-surface-2"
                style={{ fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}
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
