import { useEffect, useEffectEvent, useId, useRef, type MouseEvent, type ReactNode, type RefObject } from 'react'
import { cn } from './cn'
import { useScrollLock } from './use-scroll-lock'

export function useNativeDialog(ref: RefObject<HTMLDialogElement | null>, open: boolean, onClose: () => void) {
  const returnFocus = useRef<HTMLElement | null>(null)
  const onCloseEvent = useEffectEvent(onClose)

  useScrollLock(open)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open, ref])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const handleClose = () => {
      const target = returnFocus.current
      returnFocus.current = null
      if (target?.isConnected) target.focus({ preventScroll: true })
      onCloseEvent()
    }
    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [ref])

  // Clicks on ::backdrop are dispatched to the <dialog> itself; content clicks have a child target.
  const onBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) event.currentTarget.close()
  }

  return { onBackdropClick }
}

export function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 17.94 6M18 18 6.06 6" />
    </svg>
  )
}

export const closeButtonClasses =
  'inline-flex size-11 items-center justify-center rounded-full border border-subtle bg-surface-1 text-primary shadow-xs transition-soft hover:cursor-pointer hover:bg-surface-2 active:scale-[0.97] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]'

type DialogProps = {
  open: boolean
  onClose: () => void
  title: string
  /** Visually hide the title (it still labels the dialog). */
  hideTitle?: boolean
  className?: string
  children: ReactNode
}

/** Centered modal on native <dialog>. */
export function Dialog({ open, onClose, title, hideTitle, className, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const { onBackdropClick } = useNativeDialog(ref, open, onClose)

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClick={onBackdropClick}
      className={cn(
        'os-dialog m-auto w-[min(32rem,calc(100%-2rem))] max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-lg border border-strong bg-surface-2 p-0 text-primary shadow-lg-premium',
        className,
      )}
    >
      <div className="relative p-6">
        <button type="button" aria-label="Close dialog" onClick={() => ref.current?.close()} className={cn(closeButtonClasses, 'absolute right-3 top-3')}>
          <CloseIcon />
        </button>
        <h2 id={titleId} className={cn('text-h3 text-primary pr-12 mb-4', hideTitle && 'sr-only')}>
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  )
}
