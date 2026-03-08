/* Simple token-driven drawer primitive for overlays like the cart */
'use client';

import * as React from 'react';

import { Button } from './button';
import { cn } from '@/lib/utils';

export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom';

export type DrawerProps = React.PropsWithChildren<{
  isOpen: boolean;
  placement?: DrawerPlacement;
  onClose?: () => void;
  className?: string;
}>;

export function Drawer({ isOpen, placement = 'right', onClose, className, children }: DrawerProps) {
  const basePosition: Record<DrawerPlacement, string> = {
    left: 'inset-y-0 left-0',
    right: 'inset-y-0 right-0',
    top: 'inset-x-0 top-0',
    bottom: 'inset-x-0 bottom-0',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="absolute inset-0 bg-overlay-surface/80 transition-soft"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'absolute flex max-w-full transition-soft',
          basePosition[placement],
          placement === 'left' || placement === 'right'
            ? 'h-full w-[min(420px,100%)]'
            : 'w-full h-[min(520px,100%)]',
        )}
      >
        <div className="relative flex h-full w-full bg-surface-2 shadow-lg-premium card-base border-strong">
          <Button
            type="button"
            aria-label="Close drawer"
            onClick={onClose}
            variant="icon"
            className="absolute right-3 top-3"
          >
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18 17.94 6M18 18 6.06 6"
              />
            </svg>
          </Button>
          <div className={cn('h-full w-full overflow-y-auto p-6', className)}>{children}</div>
        </div>
      </div>
    </div>
  );
}