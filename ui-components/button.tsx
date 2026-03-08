import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-soft hover:cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-xs hover:bg-[color:var(--accent-primary-hover)] hover-lift',
        destructive:
          'bg-destructive text-primary-foreground shadow-xs hover:bg-destructive/90 hover-lift focus-visible:ring-destructive/40',
        outline:
          'border border-default bg-surface-1 text-primary shadow-xs hover:bg-surface-2 hover-lift',
        secondary:
          'bg-surface-2 text-primary shadow-xs border border-subtle hover:bg-surface-3 hover-lift',
        ghost:
          'bg-transparent text-secondary hover:bg-surface-2/60 hover:text-primary transition-soft',
        link: 'text-primary underline-offset-4 hover:underline hover:text-secondary',
        subtle:
          'bg-[color:var(--accent-primary-soft)] text-primary shadow-xs hover:bg-[color-mix(in_srgb,var(--accent-primary-soft)_80%,transparent)]',
        icon:
          'bg-surface-1 text-primary border border-subtle shadow-xs hover:bg-surface-2 hover-lift rounded-full',
      },
      size: {
        default: 'h-11 px-5 has-[>svg]:px-4',
        sm: 'h-9 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-xs',
        lg: 'h-12 rounded-lg px-7 has-[>svg]:px-5 text-base',
        icon: 'size-10 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
