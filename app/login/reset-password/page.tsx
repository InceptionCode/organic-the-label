import { cookies } from 'next/headers'
import { RECOVERY_COOKIE_NAME } from '@/lib/constants'
import ResetPasswordForm from '../component/reset-password-form'
import { queryRecoveryToken } from '@/utils/helpers/token'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const queryToken = queryRecoveryToken(sp)
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get(RECOVERY_COOKIE_NAME)?.value

  const recoveryAllowed = Boolean(
    queryToken && (!cookieToken || queryToken === cookieToken)
  )

  return <ResetPasswordForm recoveryAllowed={recoveryAllowed} />
}
