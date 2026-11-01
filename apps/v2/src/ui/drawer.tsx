import { useId, useRef, type ReactNode } from 'react'
import { cn } from './cn'
import { CloseIcon, flatCloseButtonClasses, useNativeDialog } from './dialog'

type DrawerProps = {
  open: boolean
  onClose: () => void
  title: string
  hideTitle?: boolean
  /** 'right' (default): full-height side panel. 'bottom': mobile bottom sheet with a drag handle. */
  placement?: 'right' | 'bottom'
  className?: string
  testId?: string
  /** id on the <dialog>, for a trigger's aria-controls. */
  id?: string
  /** Accessible name of the close button. */
  closeLabel?: string
  /** Shown after the title on the same line (e.g. the cart's item count). */
  meta?: ReactNode
  children: ReactNode
}

export function Drawer({
  open,
  onClose,
  title,
  hideTitle,
  placement = 'right',
  className,
  testId,
  id,
  closeLabel = 'Close drawer',
  meta,
  children,
}: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const { onBackdropClick } = useNativeDialog(ref, open, onClose)
  const bottom = placement === 'bottom'

  return (
    <dialog
      ref={ref}
      id={id}
      aria-labelledby={titleId}
      onClick={onBackdropClick}
      className={cn(
        'os-drawer m-0 max-w-full p-0 bg-transparent text-primary overscroll-contain',
        bottom
          ? 'os-drawer-bottom fixed inset-x-0 bottom-0 top-auto h-auto max-h-[85dvh] w-full'
          : 'fixed inset-y-0 right-0 left-auto h-dvh max-h-none w-[min(420px,100%)]',
      )}
    >
      <div
        className={cn(
          'relative flex w-full bg-surface-1 text-primary shadow-float border-[color:var(--border-default)]',
          bottom ? 'max-h-[85dvh] rounded-t-[4px] border-t' : 'h-full border-l',
        )}
      >
        <button
          type="button"
          aria-label={closeLabel}
          onClick={() => ref.current?.close()}
          className={cn(flatCloseButtonClasses, 'absolute right-3 z-10', bottom ? 'top-8' : 'top-5')}
        >
          <CloseIcon />
        </button>
        <div
          data-testid={testId}
          className={cn(
            'flex w-full flex-col overflow-y-auto p-6',
            bottom ? 'max-h-[85dvh] pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3' : 'h-full',
            className,
          )}
        >
          {bottom ? (
            <div aria-hidden className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-[2px] bg-[color:var(--border-default)]" />
          ) : null}
          <div className={cn('mb-6 flex min-h-11 items-baseline gap-3 pr-14', !bottom && '-mt-1', hideTitle && 'sr-only')}>
            <h2 id={titleId} className="text-h3 text-primary self-center">
              {title}
            </h2>
            {meta ? <span className="text-label tabular-nums self-center">{meta}</span> : null}
          </div>
          {children}
        </div>
      </div>
    </dialog>
  )
}
