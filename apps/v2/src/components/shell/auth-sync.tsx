import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { whenLoadedAndIdle } from '~/lib/after-load'
import { mapUser, type SessionUser } from '~/lib/map-user'
import { ACCOUNT_KEY } from '~/queries/account'
import { SESSION_KEY } from '~/queries/session'

export function AuthSync() {
  const queryClient = useQueryClient()
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    let unsubscribe: (() => void) | undefined

    const apply = (next: SessionUser | null) => {
      // A different user (or none) must never see the previous user's account data: owned badges,
      // library, profile. Covers sign-out in another tab and a new sign-in without the sign-out button.
      const previousId = queryClient.getQueryData<SessionUser | null>(SESSION_KEY)?.id ?? null
      if (previousId !== (next?.id ?? null)) queryClient.removeQueries({ queryKey: ACCOUNT_KEY })
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

    // After load and idle: the Supabase client (about 50 KB) never competes with the LCP resources. A
    // cached anonymous page still reconciles a signed-in session via INITIAL_SESSION (phase 07.3).
    const cancelStart = whenLoadedAndIdle(() => void start().catch((error) => console.error('[AuthSync]', error)), 1000)

    return () => {
      cancelled = true
      cancelStart()
      unsubscribe?.()
    }
  }, [queryClient, router])

  return null
}
