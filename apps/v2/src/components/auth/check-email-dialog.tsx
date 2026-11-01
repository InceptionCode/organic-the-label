import { Mail } from 'lucide-react'
import { ButtonLink } from '~/ui/button'
import { AuthDialog } from './auth-dialog'

export function CheckEmailDialog({ email, open, onClose }: { email: string; open: boolean; onClose: () => void }) {
  return (
    <AuthDialog
      open={open}
      onClose={onClose}
      display
      title="CHECK YOUR EMAIL"
      icon={
        <Mail aria-hidden strokeWidth={1.5} className="mx-auto mb-3 size-7" style={{ color: 'var(--accent-secondary)' }} />
      }
    >
      <p className="text-body-s text-secondary">
        We sent a confirmation link to <span className="font-medium text-primary break-all">{email}</span>. Click the link in
        that email to activate your account.
      </p>
      <ButtonLink to="/login" variant="outline" className="mt-6 w-full">
        Back to sign in
      </ButtonLink>
    </AuthDialog>
  )
}
