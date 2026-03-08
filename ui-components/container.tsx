import * as React from 'react';

import { cn } from '@/lib/utils';

type ContainerProps = React.ComponentProps<'div'>;

export function Container({ className, ...props }: ContainerProps) {
  return (
    <div
      className={cn('content-container', className)}
      {...props}
    />
  );
}

