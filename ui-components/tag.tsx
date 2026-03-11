import * as React from 'react';
import { cn } from '@/lib/utils';

export type TagProps = React.HTMLAttributes<HTMLSpanElement>;

function Tag({ className, ...props }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-body-s text-secondary bg-surface-2 border border-subtle rounded-full px-3 py-1 transition-soft',
        className,
      )}
      {...props}
    />
  );
}

export { Tag };
