import Link from 'next/link';
import { Button } from '@/ui-components/button';
import { Container } from '@/ui-components';

type HeroProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
};

export function Hero({ eyebrow, title, subtitle, ctaLabel = 'Come shop🗣️', ctaHref = '/store', className = '' }: HeroProps) {
  return (
    <section
      className={`relative section-y-hero overflow-hidden ${className}`}
      style={{
        background: `
          radial-gradient(ellipse at 5% 110%, rgba(224, 61, 42, 0.15) 0%, transparent 50%),
          var(--bg-canvas)
        `,
      }}
    >
      {/* Grain */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.02,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '180px',
        }}
      />
      <Container className="relative z-10">
        <div className="max-w-3xl">
          {eyebrow && (
            <p className="eyebrow mb-5" style={{ color: 'var(--accent-secondary)' }}>
              {eyebrow}
            </p>
          )}
          <h1
            className="text-primary mb-6 leading-none"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2.5rem, 6vw, 5rem)',
              letterSpacing: '0.02em',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-body-l text-secondary mb-10 max-w-xl">{subtitle}</p>
          )}
          {ctaHref && (
            <Button asChild size="lg">
              <Link href={ctaHref}>{ctaLabel}</Link>
            </Button>
          )}
        </div>
      </Container>

      {/* Bottom accent */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(to right, transparent 0%, var(--accent-primary) 40%, var(--accent-primary) 60%, transparent 100%)',
          opacity: 0.3,
        }}
      />
    </section>
  );
}
