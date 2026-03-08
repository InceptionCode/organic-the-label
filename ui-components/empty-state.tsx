import * as React from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

function EmptyState({ title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className,
      )}
      {...props}
    >
      <p className="text-h4 text-primary mb-2">{title}</p>
      {description && <p className="text-body-m text-muted mb-6 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

export { EmptyState };
