import * as React from 'react';

import { cn } from '@/lib/utils';

type InputProps = React.ComponentProps<'input'>;

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted selection:bg-primary selection:text-primary-foreground bg-surface-1 flex h-10 w-full min-w-0 rounded-md px-3 py-2 text-sm shadow-xs transition-soft outline-none file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-xs file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'border border-default focus-visible:border-strong focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
export type { InputProps };
