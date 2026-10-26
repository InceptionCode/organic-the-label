import type { ComponentProps } from 'react'
import { createLink, type LinkComponent } from '@tanstack/react-router'
import { cn } from './cn'

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-soft hover:cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-[0.97] touch-manipulation'

export const buttonVariants = {
  default: 'bg-primary text-primary-foreground shadow-xs hover:bg-[color:var(--accent-primary-hover)] hover-lift',
  destructive:
    'bg-destructive text-primary-foreground shadow-xs hover:bg-destructive/90 hover-lift focus-visible:ring-destructive/40',
  outline: 'border border-default bg-surface-1 text-primary shadow-xs hover:bg-surface-2 hover-lift',
  secondary: 'bg-surface-2 text-primary shadow-xs border border-subtle hover:bg-surface-3 hover-lift',
  ghost: 'bg-transparent text-secondary hover:bg-surface-2/60 hover:text-primary transition-soft',
  link: 'text-primary underline-offset-4 hover:underline hover:text-secondary',
  subtle:
    'bg-[color:var(--accent-primary-soft)] text-primary shadow-xs hover:bg-[color-mix(in_srgb,var(--accent-primary-soft)_80%,transparent)]',
  icon: 'bg-surface-1 text-primary border border-subtle shadow-xs hover:bg-surface-2 hover-lift rounded-full',
} as const

// Hit-area extension: a transparent ::after 4px larger on every side (36px -> 44px, 40px -> 48px).
const hitArea = "relative after:absolute after:-inset-1 after:content-['']"

export const buttonSizes = {
  default: 'h-11 px-5 has-[>svg]:px-4',
  sm: cn('h-9 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-xs', hitArea),
  lg: 'h-12 rounded-lg px-7 has-[>svg]:px-5 text-base',
  icon: cn('size-10 rounded-full', hitArea),
} as const

export type ButtonVariant = keyof typeof buttonVariants
export type ButtonSize = keyof typeof buttonSizes
export type ButtonStyleProps = { variant?: ButtonVariant; size?: ButtonSize; className?: string }

export function buttonClasses({ variant = 'default', size = 'default', className }: ButtonStyleProps = {}) {
  return cn(base, buttonVariants[variant], buttonSizes[size], className)
}

export function Button({ variant, size, className, type = 'button', ...props }: ComponentProps<'button'> & ButtonStyleProps) {
  return <button data-slot="button" type={type} className={buttonClasses({ variant, size, className })} {...props} />
}

type AnchorButtonProps = ComponentProps<'a'> & ButtonStyleProps

function AnchorButton({ variant, size, className, ...props }: AnchorButtonProps) {
  return <a data-slot="button" className={buttonClasses({ variant, size, className })} {...props} />
}

const CreatedButtonLink = createLink(AnchorButton)

/** Router `Link` styled as a Button (replaces v1's `asChild`). */
export const ButtonLink: LinkComponent<typeof AnchorButton> = (props) => <CreatedButtonLink {...props} />
