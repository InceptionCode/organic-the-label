import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'spinner' | 'pulse' | 'skeleton';
}

function LoadingState({ variant = 'pulse', className, ...props }: LoadingStateProps) {
  if (variant === 'spinner') {
    return (
      <div
        className={cn('flex items-center justify-center p-8', className)}
        role="status"
        aria-label="Loading"
        {...props}
      >
        <svg
          className="w-8 h-8 animate-spin text-muted"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div
        className={cn('animate-pulse space-y-4', className)}
        role="status"
        aria-label="Loading"
        {...props}
      >
        <div className="h-4 bg-surface-2 rounded w-3/4" />
        <div className="h-4 bg-surface-2 rounded w-1/2" />
        <div className="h-4 bg-surface-2 rounded w-5/6" />
      </div>
    );
  }

  return (
    <div
      className={cn('animate-pulse rounded-lg bg-surface-2 h-24', className)}
      role="status"
      aria-label="Loading"
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card-base card-padding-lg flex flex-col gap-4 animate-pulse">
      <div className="aspect-[4/3] bg-surface-2 rounded-lg" />
      <div className="h-4 bg-surface-2 rounded w-2/3" />
      <div className="h-4 bg-surface-2 rounded w-1/2" />
      <div className="h-6 bg-surface-2 rounded w-1/4 mt-2" />
    </div>
  );
}

export { LoadingState };
