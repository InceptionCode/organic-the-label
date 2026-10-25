import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { signOutFn } from '~/fns/auth.fn'
import { SESSION_KEY } from '~/queries/session'

export function SignOutButton() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const signOut = async () => {
    setPending(true)
    try {
      await signOutFn()
      queryClient.setQueryData(SESSION_KEY, null)
      await router.invalidate()
    } finally {
      setPending(false)
    }
  }

  return (
    <button type="button" onClick={signOut} disabled={pending} className="link ring-focus">
      Sign out
    </button>
  )
}
