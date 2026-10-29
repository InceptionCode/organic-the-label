import { Link } from '@tanstack/react-router'
import { FormSuccess } from '~/components/forms/split-form-page'

/** Replaces the form; focus moves to the heading so it is announced. */
export function ContactSuccess({ email }: { email: string }) {
  return (
    <FormSuccess
      title="MESSAGE RECEIVED"
      headingRef={(el) => el?.focus()}
      action={
        <Link to="/store" className="link-underline inline-flex min-h-11 items-center rounded-sm text-body-m text-primary outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]">
          Browse the store
        </Link>
      }
    >
      <p>We got your message. We&apos;ll respond as soon as possible.</p>
      <p className="text-body-s text-muted">A confirmation email is on its way to {email}.</p>
    </FormSuccess>
  )
}
