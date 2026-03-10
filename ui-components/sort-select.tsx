'use client';

import * as React from 'react';
import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

type SortSelectOption = {
  label: string;
  value: string;
};

type SortSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SortSelectOption[];
  className?: string;
};

export function SortSelect({ value, onChange, options, className }: SortSelectProps) {
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger
        className={cn(
          'flex h-11 min-w-[220px] items-center justify-between gap-3 rounded-md border border-default bg-surface-1 px-3 text-body-s text-primary shadow-sm outline-none transition hover:border-[color:var(--accent-primary)]/60 hover:bg-surface-1/80 focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]',
          className,
        )}
      >
        <Select.Value placeholder="Sort" />
        <Select.Icon>
          <ChevronDown className="h-4 w-4 text-secondary" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={8}
          className="z-50 min-w-[220px] overflow-hidden rounded-xl border border-default bg-surface-1 p-2 text-primary shadow-lg"
        >
          <Select.Viewport>
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2.5 text-body-s text-primary outline-none transition hover:bg-surface-2 data-[highlighted]:bg-surface-2"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator>
                  <Check className="h-4 w-4 text-primary" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

