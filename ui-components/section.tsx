import * as React from 'react';

import { cn } from '@/lib/utils';

type SectionVariant = 'hero' | 'standard' | 'compact';

export interface SectionProps extends React.ComponentProps<'section'> {
  variant?: SectionVariant;
  bleed?: boolean;
}

export function Section({
  variant = 'standard',
  bleed = false,
  className,
  children,
  ...props
}: SectionProps) {
  const spacingClass =
    variant === 'hero'
      ? 'section-y-hero'
      : variant === 'compact'
        ? 'section-y-compact'
        : 'section-y-standard';

  return (
    <section
      className={cn('section-wrapper', spacingClass, bleed ? '' : 'bg-canvas', className)}
      {...props}
    >
      {children}
    </section>
  );
}

