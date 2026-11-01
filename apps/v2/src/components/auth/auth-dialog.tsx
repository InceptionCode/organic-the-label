import { useId, useRef, type ReactNode } from 'react'
import { CloseIcon, flatCloseButtonClasses, useNativeDialog } from '~/ui/dialog'
import { cn } from '~/ui/cn'

type AuthDialogProps = {
  open: boolean
  onClose: () => void
  title: string
  /** Rendered above the title (the check-email icon). */
  icon?: ReactNode
  /** Centered heading in Bebas Neue (check-email) instead of the default left-aligned title. */
  display?: boolean
  children: ReactNode
}

/**
 * Native <dialog> through the shared useNativeDialog hook (focus trap, Escape, backdrop click,
 * focus return). A bottom sheet below `sm`, a centered max-w-lg modal from `sm` (v1).
 */
export function AuthDialog({ open, onClose, title, icon, display = false, children }: AuthDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const { onBackdropClick } = useNativeDialog(ref, open, onClose)

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClick={onBackdropClick}
      className={cn(
        // Flat floating layer: hairline border, 4px top radius as a sheet / 2px as a modal, --shadow-float.
        'os-dialog overflow-y-auto overscroll-contain border border-[color:var(--border-default)] bg-surface-2 p-0 text-primary shadow-float',
        'mx-0 mt-auto mb-0 w-full max-w-full max-h-[90dvh] rounded-t-[4px] rounded-b-none',
        'sm:m-auto sm:w-[calc(100%-2rem)] sm:max-w-lg sm:max-h-[calc(100dvh-2rem)] sm:rounded-[2px]',
      )}
    >
      <div className={cn('relative p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-6', display && 'text-center')}>
        <button type="button" aria-label="Close" onClick={() => ref.current?.close()} className={cn(flatCloseButtonClasses, 'absolute right-3 top-3')}>
          <CloseIcon />
        </button>
        {icon}
        <h2
          id={titleId}
          className={cn(
            display ? 'text-h3 px-12' : 'text-h4 pr-12 min-h-11 flex items-center',
            'mb-4 text-primary',
          )}
        >
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  )
}
