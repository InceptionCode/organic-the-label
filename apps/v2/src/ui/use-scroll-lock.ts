import { useEffect } from 'react'

const LOCK_CLASS = 'scroll-locked'
const GUTTER_CLASS = 'scroll-locked-gutter'
let locks = 0

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    const root = document.documentElement
    if (locks === 0 && window.innerWidth > root.clientWidth) root.classList.add(GUTTER_CLASS)
    locks += 1
    root.classList.add(LOCK_CLASS)
    return () => {
      locks = Math.max(0, locks - 1)
      if (locks === 0) root.classList.remove(LOCK_CLASS, GUTTER_CLASS)
    }
  }, [active])
}
