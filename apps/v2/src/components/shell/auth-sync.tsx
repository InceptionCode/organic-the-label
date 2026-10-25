import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { mapUser, type SessionUser } from '~/lib/map-user'
import { SESSION_KEY } from '~/queries/session'

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void) => number
  cancelIdleCallback?: (handle: number) => void
}

export function AuthSync() {
  const queryClient = useQueryClient()
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    let unsubscribe: (() => void) | undefined

    const apply = (next: SessionUser | null) => {
      queryClient.setQueryData(SESSION_KEY, next)
      void router.invalidate()
    }

    const start = async () => {
      const { getSupabaseBrowserClient } = await import('~/server/supabase/browser')
      if (cancelled) return
      const supabase = getSupabaseBrowserClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      )
      const { data } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
        const next = mapUser(session?.user)
        const cachedId = queryClient.getQueryData<SessionUser | null>(SESSION_KEY)?.id ?? null
        switch (event) {
          case 'INITIAL_SESSION':
          case 'SIGNED_IN':
            if (cachedId !== (next?.id ?? null)) apply(next)
            break
          case 'USER_UPDATED':
            apply(next)
            break
          case 'SIGNED_OUT':
            if (cachedId !== null) apply(null)
            break
        }
      })
      unsubscribe = () => data.subscription.unsubscribe()
    }

    const w = window as IdleWindow
    const run = () => void start().catch((error) => console.error('[AuthSync]', error))
    const handle = w.requestIdleCallback ? w.requestIdleCallback(run) : window.setTimeout(run, 1)

    return () => {
      cancelled = true
      if (w.cancelIdleCallback) w.cancelIdleCallback(handle)
      else window.clearTimeout(handle)
      unsubscribe?.()
    }
  }, [queryClient, router])

  return null
}
