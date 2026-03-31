'use client'

import { Slot } from '@radix-ui/react-slot';
import { PropsWithChildren, useState, type ReactNode } from 'react';
import { Input, type InputProps } from './input';
import { EyeSlashIcon, EyeIcon } from '@heroicons/react/24/outline';

export type TextFieldProps = PropsWithChildren<
  {
    invert?: true;
    label?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    placeholder?: string;
    type?: string;
    name?: string;
  } & InputProps
>;

const PasswordRevealIcon = ({
  reveal,
}: {
  reveal: boolean;
}) => {
  return (
    <>
      {reveal ? (
        <EyeIcon className="size-5 inline-flex hover:cursor-pointer" />
      ) : (
        <EyeSlashIcon className="size-5 inline-flex hover:cursor-pointer" />
      )}
    </>
  );
};

export const TextField = ({
  name,
  label,
  leftIcon,
  rightIcon,
  placeholder,
  invert,
  type = 'text',
  ...props
}: TextFieldProps) => {
  const darkTextColor = invert ? 'dark:text-black' : 'dark:text-white';
  const [revealPassword, setRevealPassword] = useState<boolean>(false);
  const hasLeft = Boolean(leftIcon);
  const hasRight = Boolean(rightIcon) || type === 'password';

  return (
    <>
      {label && (
        <label
          htmlFor={name}
          className={`block text-sm font-medium text-secondary mb-1 ${darkTextColor}`}
        >
          {label}
        </label>
      )}
      <div className="relative w-full">
        <Input
          id={name}
          name={name}
          placeholder={placeholder}
          type={revealPassword ? 'text' : type}
          {...props}
          className={[
            invert ? 'dark:invert' : '',
            hasLeft ? 'pl-10' : '',
            hasRight ? 'pr-10' : '',
          ].join(' ')}
        />
        {hasLeft && (
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
            <Slot id="left">{leftIcon}</Slot>
          </div>
        )}
        {hasRight && (
          <div className="absolute inset-y-0 right-3 flex items-center text-muted">
            {rightIcon ? (
              <Slot id="right">{rightIcon}</Slot>
            ) : (
              <button
                type="button"
                className="inline-flex rounded-sm transition-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface-1)]"
                aria-label={revealPassword ? 'Hide password' : 'Show password'}
                aria-pressed={revealPassword}
                onClick={() => setRevealPassword((v) => !v)}
              >
                <PasswordRevealIcon reveal={revealPassword} />
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};
