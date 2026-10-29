import type { ReactNode } from 'react'
import { LazyGrainGradient } from '~/components/visuals/lazy'

type AuthCardProps = {
  /** Short line in Bebas over the brand visual ("Welcome back"). */
  eyebrow: string
  title: string
  children: ReactNode
  /** Line under the form, e.g. "Already have an account? Sign in here". */
  footer?: ReactNode
}

/**
 * Shared shell for /login, /signup, /login/reset-password and /auth/confirm: the grain shader as a
 * full-height brand visual on the left half (lg), the unboxed form on the right. Below lg the visual
 * is a slim band above the form. The shader is lazy (poster on reduced motion or Save-Data).
 */
export function AuthCard({ eyebrow, title, children, footer }: AuthCardProps) {
  return (
    <div className="grid min-h-[calc(100dvh-4rem)] bg-canvas lg:min-h-[calc(100dvh-72px)] lg:grid-cols-2">
      {/* lg: sticks to the viewport so the line stays in view next to a tall form (sign up). */}
      <div className="relative h-36 overflow-hidden sm:h-40 lg:sticky lg:top-[72px] lg:h-[calc(100dvh-72px)] lg:self-start" aria-hidden="true">
        <LazyGrainGradient
          className="absolute inset-0"
          colors={['#B31919', '#D9C7A7', '#831919', '#2A1410']}
          softness={0.6}
          intensity={0.4}
          noise={0.3}
        />
        {/* Keeps the line on near-black and fades the band into the canvas. */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, var(--bg-canvas) 0%, color-mix(in srgb, var(--bg-canvas) 45%, transparent) 45%, transparent 100%)' }}
        />
        <p className="absolute inset-x-6 bottom-5 hidden text-display-m text-primary md:inset-x-10 lg:bottom-12 lg:block xl:inset-x-14">
          {eyebrow}
        </p>
      </div>

      <div className="flex items-center px-6 pb-16 pt-8 md:px-10 lg:px-14 lg:py-16 xl:px-20">
        <div className="mx-auto w-full max-w-[28rem] space-y-8 lg:mx-0">
          <header>
            <h1 className="text-h1 text-primary">{title}</h1>
          </header>
          {children}
          {footer ? <p className="border-t border-[color:var(--border-subtle)] pt-6 text-body-s text-secondary">{footer}</p> : null}
        </div>
      </div>
    </div>
  )
}
