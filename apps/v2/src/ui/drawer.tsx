import { useId, useRef, type ReactNode } from 'react'
import { cn } from './cn'
import { CloseIcon, closeButtonClasses, useNativeDialog } from './dialog'

type DrawerProps = {
  open: boolean
  onClose: () => void
  title: string
  hideTitle?: boolean
  className?: string
  testId?: string
  children: ReactNode
}

export function Drawer({ open, onClose, title, hideTitle, className, testId, children }: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const { onBackdropClick } = useNativeDialog(ref, open, onClose)

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClick={onBackdropClick}
      className="os-drawer fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-[min(420px,100%)] max-w-full p-0 bg-transparent text-primary overscroll-contain"
    >
      <div className="relative flex h-full w-full bg-surface-2 shadow-lg-premium card-base border-strong">
        <button type="button" aria-label="Close drawer" onClick={() => ref.current?.close()} className={cn(closeButtonClasses, 'absolute right-3 top-3 z-10')}>
          <CloseIcon />
        </button>
        <div data-testid={testId} className={cn('flex h-full w-full flex-col overflow-y-auto p-6', className)}>
          <h2 id={titleId} className={cn('text-h3 text-primary mb-6 pt-10', hideTitle && 'sr-only')}>
            {title}
          </h2>
          {children}
        </div>
      </div>
    </dialog>
  )
}
