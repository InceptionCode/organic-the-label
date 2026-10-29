import { useEffect, type RefObject } from 'react'

// Moves focus to a page heading after client-side navigation so screen readers announce the
// new page. On the first (SSR-hydrated) render focus is left alone: RootLayout calls
// useMarkHydrated, whose effect runs after every child effect of the initial commit.
let hydrated = false

export function useMarkHydrated() {
  useEffect(() => {
    hydrated = true
    // Lets E2E tests (and anything else) wait for interactivity: <html data-hydrated="true">.
    document.documentElement.dataset.hydrated = 'true'
  }, [])
}

export function useFocusOnClientNav(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (hydrated) ref.current?.focus()
  }, [ref])
}
