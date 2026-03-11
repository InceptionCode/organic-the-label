import * as React from 'react';
import { cn } from '@/lib/utils';

export interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
}

function Divider({ className, orientation = 'horizontal', ...props }: DividerProps) {
  return (
    <hr
      className={cn(
        'border-0 border-[color:var(--border-subtle)]',
        orientation === 'horizontal' ? 'w-full border-t' : 'h-full border-l',
        className,
      )}
      {...props}
    />
  );
}

export { Divider };
