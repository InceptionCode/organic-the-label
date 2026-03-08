import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center font-medium rounded-full transition-soft',
  {
    variants: {
      variant: {
        default: 'bg-[color:var(--accent-primary-soft)] text-[color:var(--accent-primary)]',
        secondary: 'bg-surface-2 text-secondary border border-subtle',
        muted: 'bg-surface-3 text-muted',
        success: 'bg-[color:var(--success)]/15 text-[color:var(--success)]',
        warning: 'bg-[color:var(--warning)]/15 text-[color:var(--warning)]',
        danger: 'bg-[color:var(--danger)]/15 text-[color:var(--danger)]',
      },
      size: {
        sm: 'text-caption px-2 py-0.5',
        md: 'text-body-s px-2.5 py-1',
        lg: 'text-body-m px-3 py-1.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
