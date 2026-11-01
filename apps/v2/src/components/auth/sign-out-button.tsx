import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { signOutFn } from '~/fns/auth.fn'
import { ACCOUNT_KEY } from '~/queries/account'
import { SESSION_KEY } from '~/queries/session'
import { Button, type ButtonVariant } from '~/ui/button'
import { cn } from '~/ui/cn'

type SignOutButtonProps = { variant?: ButtonVariant; className?: string }

/**
 * Server sign-out (clears the cookies), then the client copy: the navbar flips because ['session']
 * is the only source of truth. Navigating before dropping ['account'] keeps the mounted account
 * page from refetching its queries without a session.
 */
export function SignOutButton({ variant = 'outline', className }: SignOutButtonProps) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  const signOut = async () => {
    setPending(true)
    setFailed(false)
    try {
      await signOutFn()
    } catch {
      setFailed(true)
      setPending(false)
      return
    }
    queryClient.setQueryData(SESSION_KEY, null)
    await router.navigate({ to: '/', replace: true })
    queryClient.removeQueries({ queryKey: ACCOUNT_KEY })
    setPending(false)
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Button variant={variant} onClick={signOut} disabled={pending} aria-busy={pending || undefined} data-testid="sign-out-button" className="w-full">
        Sign out
      </Button>
      {failed ? (
        <p role="alert" className="text-body-s" style={{ color: 'var(--danger)' }}>
          Could not sign out. Try again.
        </p>
      ) : null}
    </div>
  )
}
