import { Link } from '@tanstack/react-router'
import { LOGO_UI_PATH } from '~/seo/site'
import { cn } from '~/ui/cn'
import { accountLinks, companyLinks, storeCategoryLinks, type FooterLink } from './nav-links'

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-text)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]'

const linkClasses = cn(
  'text-[0.9375rem] leading-6 text-secondary hover:text-primary active:opacity-70 transition-soft w-fit rounded-sm max-sm:min-h-11 max-sm:inline-flex max-sm:items-center',
  focusRing,
)

function FooterColumn({ title, label, links }: { title: string; label: string; links: FooterLink[] }) {
  return (
    <div className="flex flex-col gap-3 sm:gap-5">
      <p className="text-label">{title}</p>
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
    <footer className="bg-canvas border-t border-subtle overflow-hidden">
      <div className="content-container">
        <div className="pt-16 pb-12 md:pt-24 md:pb-16 grid grid-cols-2 md:grid-cols-12 gap-x-6 gap-y-12">
          <div className="col-span-2 md:col-span-4 lg:col-span-5 flex flex-col gap-5">
            <Link
              to="/"
              className={cn('flex items-center gap-2.5 rounded-sm w-fit max-sm:min-h-11 active:opacity-80', focusRing)}
              aria-label="Organic Sonics home"
            >
              <img
                src={LOGO_UI_PATH}
                alt=""
                width={32}
                height={32}
                loading="lazy"
                className="object-contain size-8"
              />
              <span className="text-primary font-heading text-[1.375rem] leading-none tracking-[0.05em] pt-0.5">ORGANIC SONICS</span>
            </Link>
            <p className="text-body-m text-muted max-w-[34ch]">
              Premium tools for modern producers. Beats, kits, and sound design for late-night sessions.
            </p>
          </div>

          <div className="col-span-1 md:col-span-3 lg:col-span-3">
            <FooterColumn title="Store" label="Store categories" links={storeCategoryLinks} />
          </div>
          <div className="col-span-1 md:col-span-3 lg:col-span-2">
            <FooterColumn title="Company" label="Company links" links={companyLinks} />
          </div>
          <div className="col-span-2 md:col-span-2 lg:col-span-2">
            <FooterColumn title="Account" label="Account links" links={accountLinks} />
          </div>
        </div>

        <div className="py-6 flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-6 border-t border-subtle">
          <div className="flex flex-col gap-2">
            <p className="text-label">© {year} Organic Sonics. All rights reserved.</p>
            {/* Activity tracking notice (phase 06). There is no privacy page yet; keep this in step with the account preferences note. */}
            <p className="text-label font-normal max-w-[62ch]">
              We record what you browse and play here only to personalize your experience and improve the site. We never sell it or
              share it with advertisers or other third parties.
            </p>
          </div>
          <p className="text-label sm:shrink-0">Made for producers, by producers.</p>
        </div>
      </div>

      <p
        aria-hidden
        className="select-none pointer-events-none whitespace-nowrap text-center font-heading leading-[0.78] tracking-[0.01em] text-[19.8vw] translate-y-[0.1em] text-[color:color-mix(in_srgb,var(--text-primary)_7%,transparent)]"
      >
        ORGANIC SONICS
      </p>
    </footer>
  )
}
