import { useEffect, useEffectEvent, useId, useRef, useState, type KeyboardEvent, type ToggleEvent } from 'react'
import { Check, Download, EllipsisVertical, ExternalLink, Link2, Loader2 } from 'lucide-react'
import { safeExternalHref } from '~/lib/embed-url'
import type { CompositionListItem } from '~/server/compositions/columns'
import { Button } from '~/ui/button'

type CompositionActionsProps = {
  slug: string
  title: string
  platform: CompositionListItem['platform']
  embedUrl: string
  /** Red primary Download (the selected row); otherwise outline, so the list isn't a column of red. */
  primary?: boolean
}
type DownloadStatus = 'idle' | 'loading' | 'done' | 'error'

const MENU_GAP = 8
const MENU_ITEM =
  'flex min-h-11 w-full items-center gap-2.5 rounded-[2px] px-2.5 text-left text-body-s text-secondary no-underline outline-none transition-colors duration-150 hover:cursor-pointer hover:bg-surface-3 hover:text-[color:var(--text-primary)] focus-visible:bg-surface-3 focus-visible:text-[color:var(--text-primary)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-primary)] active:opacity-70 disabled:pointer-events-none disabled:opacity-40'

const STATUS_LABEL: Record<DownloadStatus, string> = { idle: 'Download loop', loading: 'Preparing…', done: 'Downloaded', error: 'Try again' }
const LIVE_LABEL: Record<DownloadStatus, string> = { idle: '', loading: 'Preparing your download', done: 'Download ready', error: 'Download failed, try again' }

/**
 * v1 composition-actions.tsx with the Radix Popover replaced by the native `popover` attribute: top
 * layer, light dismiss and Escape for free. The menu is placed under its trigger, end aligned, from
 * a measured rect (CSS anchor positioning is not Baseline yet).
 */
export function CompositionActions({ slug, title, platform, embedUrl, primary = true }: CompositionActionsProps) {
  const [status, setStatus] = useState<DownloadStatus>('idle')
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const busy = status === 'loading'
  const href = safeExternalHref(embedUrl)

  const place = () => {
    const trigger = triggerRef.current
    const menu = menuRef.current
    if (!trigger || !menu) return
    const rect = trigger.getBoundingClientRect()
    const left = Math.max(MENU_GAP, Math.min(rect.right - menu.offsetWidth, window.innerWidth - menu.offsetWidth - MENU_GAP))
    const below = rect.bottom + MENU_GAP
    const top = below + menu.offsetHeight > window.innerHeight ? Math.max(MENU_GAP, rect.top - MENU_GAP - menu.offsetHeight) : below
    menu.style.left = `${left}px`
    menu.style.top = `${top}px`
  }

  // While open, keep the fixed-position menu attached to its trigger.
  const onViewportChange = useEffectEvent(place)
  useEffect(() => {
    if (!open) return
    const listener = () => onViewportChange()
    window.addEventListener('scroll', listener, { passive: true, capture: true })
    window.addEventListener('resize', listener)
    return () => {
      window.removeEventListener('scroll', listener, { capture: true })
      window.removeEventListener('resize', listener)
    }
  }, [open])

  const onToggle = (event: ToggleEvent<HTMLDivElement>) => {
    const isOpen = event.newState === 'open'
    setOpen(isOpen)
    if (isOpen) {
      place()
      menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus()
    } else if (!document.activeElement || document.activeElement === document.body || menuRef.current?.contains(document.activeElement)) {
      triggerRef.current?.focus()
    }
  }

  const closeMenu = () => menuRef.current?.hidePopover()

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [])]
    const index = items.indexOf(document.activeElement as HTMLElement)
    const next =
      event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
    items[next]?.focus()
  }

  const runDownload = async () => {
    setStatus('loading')
    try {
      const res = await fetch(`/compositions/download/${encodeURIComponent(slug)}`)
      if (!res.ok) throw new Error(`Download failed (${res.status})`)
      const objectUrl = URL.createObjectURL(await res.blob())
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = `${slug}.zip`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(objectUrl)
      setStatus('done')
      window.setTimeout(() => setStatus('idle'), 2500)
    } catch {
      setStatus('error')
      window.setTimeout(() => setStatus('idle'), 4000)
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/compositions#${slug}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable (permissions or insecure context): nothing to copy into.
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant={primary ? 'default' : 'outline'} onClick={() => void runDownload()} disabled={busy} aria-busy={busy}>
        {status === 'loading' && <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden />}
        {status === 'done' && <Check aria-hidden />}
        {(status === 'idle' || status === 'error') && <Download aria-hidden />}
        {STATUS_LABEL[status]}
      </Button>

      <button
        ref={triggerRef}
        type="button"
        popoverTarget={menuId}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More options for ${title}`}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-[2px] border border-[color:var(--border-default)] bg-transparent text-secondary outline-none transition-[color,border-color,transform] duration-150 hover:cursor-pointer hover:border-[color:var(--text-primary)] hover:text-[color:var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)] active:scale-95"
      >
        <EllipsisVertical className="size-4" aria-hidden />
      </button>

      <div
        ref={menuRef}
        id={menuId}
        popover="auto"
        role="menu"
        aria-label={`Options for ${title}`}
        onToggle={onToggle}
        onKeyDown={onMenuKeyDown}
        className="shadow-float fixed inset-auto m-0 w-56 overflow-hidden rounded-[2px] border border-[color:var(--border-default)] bg-surface-2 p-1 text-primary transition-[opacity,transform] duration-150 ease-out starting:open:-translate-y-1 starting:open:opacity-0 motion-reduce:transition-none"
      >
        <button
          type="button"
          role="menuitem"
          disabled={busy}
          onClick={() => {
            closeMenu()
            void runDownload()
          }}
          className={MENU_ITEM}
        >
          <Download className="size-4" aria-hidden />
          {busy ? 'Preparing…' : 'Download (.zip)'}
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            void copyLink()
            closeMenu()
          }}
          className={MENU_ITEM}
        >
          {copied ? <Check className="size-4" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
          {copied ? 'Link copied' : 'Copy loop link'}
        </button>
        {href && (
          <a role="menuitem" href={href} target="_blank" rel="noopener noreferrer" onClick={closeMenu} className={MENU_ITEM}>
            <ExternalLink className="size-4" aria-hidden />
            Open on {platform === 'youtube' ? 'YouTube' : 'Instagram'}
          </a>
        )}
      </div>

      <span aria-live="polite" className="sr-only">
        {copied ? 'Link copied' : LIVE_LABEL[status]}
      </span>
    </div>
  )
}
