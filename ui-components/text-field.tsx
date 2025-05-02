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
  setReveal,
}: {
  reveal: boolean;
  setReveal: (state: boolean) => void;
}) => {
  return (
    <>
      {reveal ? (
        <EyeIcon
          className="size-5 inline-flex hover:cursor-pointer"
          onClick={() => setReveal(!reveal)}
        />
      ) : (
        <EyeSlashIcon
          className="size-5 inline-flex hover:cursor-pointer"
          onClick={() => setReveal(!reveal)}
        />
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

  return (
    <>
      {label && (
        <label
          htmlFor={name}
          className={`block text-lg font-medium text-gray-900 ${darkTextColor}`}
        >
          {label}
        </label>
      )}
      <div className="inline-flex">
        {leftIcon && (
          <Slot className="pr-2" id="left">
            {leftIcon}
          </Slot>
        )}
        <Input
          name={name}
          placeholder={placeholder}
          type={revealPassword ? 'text' : type}
          {...props}
          className={`${invert && 'dark:invert'}`}
        />
        {(rightIcon || type === 'password') && (
          <Slot className="pr-2" id="right">
            {rightIcon || (
              <PasswordRevealIcon reveal={revealPassword} setReveal={setRevealPassword} />
            )}
          </Slot>
        )}
      </div>
    </>
  );
};
