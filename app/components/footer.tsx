'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/ui-components';
import { STORE_CATEGORIES } from '@/lib/constants';

const companyLinks = [
  { label: 'About', href: '/about' },
  { label: 'Explore', href: '/explore' },
  { label: 'Support', href: '/support' },
  { label: 'Search', href: '/search' },
];

const accountLinks = [
  { label: 'Sign up', href: '/signup' },
  { label: 'Log in', href: '/login' },
  { label: 'My account', href: '/account' },
];

export function Footer() {
  return (
    <footer
      style={{
        background: 'var(--surface-1)',
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      <Container>
        {/* Main footer grid */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-5">
            <Link
              href="/"
              className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] rounded w-fit"
              aria-label="Organic Sonics"
            >
              <Image
                src="/brand-assets/organic-sonics-logo.png"
                alt="Organic Sonics"
                width={28}
                height={28}
                className="object-contain opacity-90"
              />
              <span
                className="text-primary"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.1rem',
                  letterSpacing: '0.05em',
                }}
              >
                ORGANIC SONICS
              </span>
            </Link>
            <p className="text-body-s text-muted max-w-[220px] leading-relaxed">
              Premium tools for modern producers. Beats, kits, and sound design for late-night sessions.
            </p>
          </div>

          {/* Store categories column */}
          <div className="flex flex-col gap-4">
            <p
              className="text-primary"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.85rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Store
            </p>
            <nav className="flex flex-col gap-2.5" aria-label="Store categories">
              {STORE_CATEGORIES.map((cat) => (
                <Link
                  key={cat.category}
                  href={cat.href}
                  className="text-body-s text-muted hover:text-primary transition-soft w-fit"
                >
                  {cat.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Company column */}
          <div className="flex flex-col gap-4">
            <p
              className="text-primary"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.85rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Company
            </p>
            <nav className="flex flex-col gap-2.5" aria-label="Company links">
              {companyLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-body-s text-muted hover:text-primary transition-soft w-fit"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Account column */}
          <div className="flex flex-col gap-4">
            <p
              className="text-primary"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.85rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Account
            </p>
            <nav className="flex flex-col gap-2.5" aria-label="Account links">
              {accountLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-body-s text-muted hover:text-primary transition-soft w-fit"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="py-5 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <p className="text-caption text-muted">
            © {new Date().getFullYear()} Organic Sonics. All rights reserved.
          </p>
          <p className="text-caption" style={{ color: 'var(--accent-secondary)' }}>
            Made for producers, by producers.
          </p>
        </div>
      </Container>
    </footer>
  );
}
