import Link from 'next/link';
import { Button } from '@/ui-components/button';
import { Section } from '@/ui-components';
import { Container } from '@/ui-components';

type CTASectionProps = {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export function CTASection({
  title = 'Ready to level up your sound?',
  subtitle = 'Browse beats, kits, and packs built for serious producers.',
  ctaLabel = 'Shop the store',
  ctaHref = '/store',
}: CTASectionProps) {
  return (
    <Section variant="standard" className="bg-surface-1">
      <Container>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-display-m text-primary mb-4">{title}</h2>
          {subtitle && <p className="text-body-l text-secondary mb-8">{subtitle}</p>}
          <Button asChild size="lg">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}
