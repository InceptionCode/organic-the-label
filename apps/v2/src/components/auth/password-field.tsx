import { useState, type ComponentProps } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Field, inputClasses } from '~/ui/field'
import { cn } from '~/ui/cn'

type PasswordInputProps = Omit<ComponentProps<'input'>, 'type'>

/** Input plus a plain-icon show/hide toggle (48x48 target). Field clones it with id and aria props, which land on the input. */
function PasswordInput({ id, className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input {...props} id={id} type={visible ? 'text' : 'password'} className={cn(inputClasses, 'pr-14', className)} />
      <button
        type="button"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        aria-controls={id}
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 inline-flex w-12 cursor-pointer items-center justify-center rounded-r-[2px] text-muted transition-soft hover:text-primary active:scale-[0.94] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-primary)] touch-manipulation"
      >
        {visible ? <Eye aria-hidden className="size-5" /> : <EyeOff aria-hidden className="size-5" />}
      </button>
    </div>
  )
}

type PasswordFieldProps = { label: string; hint?: string; error?: string } & PasswordInputProps

export function PasswordField({ label, hint, error, ...inputProps }: PasswordFieldProps) {
  return (
    <Field label={label} hint={hint} error={error}>
      <PasswordInput {...inputProps} />
    </Field>
  )
}
