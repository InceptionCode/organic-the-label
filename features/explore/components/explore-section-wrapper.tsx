import * as React from 'react';
import { Section } from '@/ui-components/section';
import { Container } from '@/ui-components/container';
import { cn } from '@/lib/utils';
import type { ExploreSectionMetadata } from '@/features/explore/types';

type SectionVariant = 'hero' | 'standard' | 'compact';

export type ExploreSectionWrapperProps = {
  metadata: ExploreSectionMetadata;
  variant?: SectionVariant;
  className?: string;
  children: React.ReactNode;
};

/**
 * Reusable wrapper for Explore sections. Keeps spacing and visual rhythm consistent.
 * Use for every gated section so id/label are set for a11y and future tracking.
 */
export function ExploreSectionWrapper({
  metadata,
  variant = 'standard',
  className,
  children,
}: ExploreSectionWrapperProps) {
  return (
    <Section
      id={metadata.id}
      aria-label={metadata.label}
      variant={variant}
      className={cn(className)}
    >
      <Container>{children}</Container>
    </Section>
  );
}
