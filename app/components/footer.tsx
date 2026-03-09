'use client'

import Link from 'next/link';
import { Container } from '@/ui-components';

const footerLinks = [
  { label: 'Store', href: '/store' },
  { label: 'About', href: '/about' },
  { label: 'Support', href: '/support' },
  { label: 'Search', href: '/search' },
];

export function Footer() {
  return (
    <footer className="border-t border-subtle bg-surface-1">
      <Container>
        <div className="py-12 md:py-16 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div>
            <p className="text-h5 text-primary mb-2">Organic Sonics</p>
            <p className="text-body-s text-muted max-w-sm">
              Organic Sonics for ya head top! Premium tools for modern producers. Beats, kits, and sound design for late-night sessions.
            </p>
          </div>
          <nav className="flex flex-wrap gap-6" aria-label="Footer">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-body-s text-secondary hover:text-primary transition-soft"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="py-4 border-t border-subtle">
          <p className="text-caption text-muted">© {new Date().getFullYear()} Organic Sonics. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
}
