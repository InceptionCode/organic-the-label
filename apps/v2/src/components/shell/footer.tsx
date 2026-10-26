import { Link } from '@tanstack/react-router'
import { cn } from '~/ui/cn'
import { accountLinks, companyLinks, storeCategoryLinks, type FooterLink } from './nav-links'

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface-1)]'

const headingClasses = 'text-primary font-heading text-[0.85rem] tracking-[0.1em] uppercase'

const linkClasses = cn(
  'text-body-s text-muted hover:text-primary active:opacity-70 transition-soft w-fit rounded-sm max-sm:min-h-11 max-sm:inline-flex max-sm:items-center',
  focusRing,
)

function FooterColumn({ title, label, links }: { title: string; label: string; links: FooterLink[] }) {
  return (
    <div className="flex flex-col gap-2 sm:gap-4">
      <p className={headingClasses}>{title}</p>
      <nav className="flex flex-col sm:gap-2.5" aria-label={label}>
        {links.map((link) => (
          <Link key={link.label} to={link.to as never} search={link.search as never} className={linkClasses}>
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{ background: 'var(--surface-1)', borderTop: '1px solid var(--border-subtle)' }}>
      <div className="content-container">
        <div className="py-16 grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12">
          <div className="col-span-2 md:col-span-1 flex flex-col gap-5">
            <Link to="/" className={cn('flex items-center gap-2.5 rounded w-fit max-sm:min-h-11 active:opacity-80', focusRing)} aria-label="Organic Sonics">
              <img
                src="/brand-assets/organic-sonics-logo.png"
                alt=""
                width={28}
                height={28}
                loading="lazy"
                className="object-contain opacity-90 size-7"
              />
              <span className="text-primary font-heading text-[1.1rem] tracking-[0.05em]">ORGANIC SONICS</span>
            </Link>
            <p className="text-body-s text-muted max-w-[220px] leading-relaxed">
              Premium tools for modern producers. Beats, kits, and sound design for late-night sessions.
            </p>
          </div>

          <FooterColumn title="Store" label="Store categories" links={storeCategoryLinks} />
          <FooterColumn title="Company" label="Company links" links={companyLinks} />
          <FooterColumn title="Account" label="Account links" links={accountLinks} />
        </div>

        <div
          className="py-5 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <p className="text-caption text-muted">© {year} Organic Sonics. All rights reserved.</p>
          <p className="text-caption" style={{ color: 'var(--accent-secondary)' }}>
            Made for producers, by producers.
          </p>
        </div>
      </div>
    </footer>
  )
}
