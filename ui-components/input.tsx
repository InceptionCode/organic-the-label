import * as React from 'react';

import { cn } from '@/lib/utils';

type InputProps = React.ComponentProps<'input'>;

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground bg-input/5 dark:bg-input/30 flex h-9 w-full min-w-0 rounded-md px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        'border-t-transparent border-l-transparent border-r-transparent border-b-1 rounded-none border-b-red-400/90 focus-visible:outline-none focus-visible:border-b-2',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
export type { InputProps };
