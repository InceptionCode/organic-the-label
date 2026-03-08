import Link from 'next/link';
import { Button } from '@/ui-components/button';
import { Container } from '@/ui-components';

type HeroProps = {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
};

export function Hero({ title, subtitle, ctaLabel = 'Come shop🗣️', ctaHref = '/store', className = '' }: HeroProps) {
  return (
    <section className={`section-y-hero bg-canvas ${className}`}>
      <Container>
        <div className="max-w-3xl">
          <h1 className="text-display-l md:text-display-xl text-primary mb-6">{title}</h1>
          {subtitle && <p className="text-body-l text-secondary mb-10">{subtitle}</p>}
          {ctaHref && (
            <Button asChild size="lg">
              <Link href={ctaHref}>{ctaLabel}</Link>
            </Button>
          )}
        </div>
      </Container>
    </section>
  );
}
