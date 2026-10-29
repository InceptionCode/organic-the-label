import type { ComponentProps } from 'react'
import { createLink, type LinkComponent } from '@tanstack/react-router'
import { cn } from './cn'

// Flat buttons: 2px radius, no shadow or lift. The focus ring uses the red text token
// because the fill red is under 3:1 on the black canvas.
const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-sans text-sm font-medium transition-soft hover:cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-text)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-[0.98] touch-manipulation'

const quietBorder =
  'border border-[color:var(--border-strong)] bg-transparent text-primary hover:border-[color:color-mix(in_srgb,var(--text-primary)_50%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--text-primary)_4%,transparent)]'

export const buttonVariants = {
  default: 'bg-primary text-primary-foreground hover:bg-[color:var(--accent-primary-hover)]',
  destructive: 'bg-destructive text-primary-foreground hover:bg-destructive/90 focus-visible:ring-destructive/40',
  outline: quietBorder,
  secondary: quietBorder,
  ghost: 'bg-transparent text-secondary hover:text-primary hover:bg-[color:color-mix(in_srgb,var(--text-primary)_4%,transparent)]',
  link: 'text-primary link-underline',
  subtle:
    'bg-[color:var(--accent-primary-soft)] text-primary hover:bg-[color-mix(in_srgb,var(--accent-primary-soft)_80%,transparent)]',
  icon: 'bg-transparent text-primary hover:bg-[color:color-mix(in_srgb,var(--text-primary)_6%,transparent)]',
} as const

// Hit-area extension: a transparent ::after 4px larger on every side (40px -> 48px).
const hitArea = "relative after:absolute after:-inset-1 after:content-['']"

export const buttonSizes = {
  default: 'h-12 px-6 has-[>svg]:px-5',
  sm: cn('h-10 gap-1.5 px-4 has-[>svg]:px-3 text-sm', hitArea),
  lg: 'h-14 px-8 has-[>svg]:px-6 text-base',
  icon: cn('size-10 rounded-sm', hitArea),
} as const

export type ButtonVariant = keyof typeof buttonVariants
export type ButtonSize = keyof typeof buttonSizes
export type ButtonStyleProps = { variant?: ButtonVariant; size?: ButtonSize; className?: string }

export function buttonClasses({ variant = 'default', size = 'default', className }: ButtonStyleProps = {}) {
  // A text link has no box, so it takes no size classes.
  return cn(base, buttonVariants[variant], variant === 'link' ? null : buttonSizes[size], className)
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
