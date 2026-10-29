import { Link } from '@tanstack/react-router'
import { FormSuccess } from '~/components/forms/split-form-page'

/** Replaces the form on success (v1 "IT'S ON THE WAY"). Focus moves to the heading so it is announced. */
export function FreeResourceSuccess() {
  return (
    <FormSuccess
      title="IT'S ON THE WAY"
      headingRef={(el) => el?.focus()}
      action={
        <Link
          to="/store"
          className="link-underline inline-flex min-h-11 items-center rounded-sm text-body-m text-primary outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]"
        >
          Browse the store
        </Link>
      }
    >
      <p>Check your inbox. Your download link is on the way. Check your spam folder if you don&apos;t see it within a few minutes.</p>
    </FormSuccess>
  )
}
