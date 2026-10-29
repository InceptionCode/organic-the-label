import { ShieldAlert } from 'lucide-react'
import { SignOutButton } from '~/components/auth/sign-out-button'
import type { AccountSummary } from '~/server/account/summary'
import { AccountCard } from './account-card'
import { formatMonthYear } from './format'

export function AccountProfile({ summary }: { summary: AccountSummary }) {
  const memberSince = formatMonthYear(summary.memberSince)
  const rows = [
    { label: 'Username', value: summary.displayName ?? 'Not set' },
    { label: 'Email', value: summary.email ?? 'Not set' },
    ...(memberSince ? [{ label: 'Member since', value: memberSince }] : []),
  ]

  return (
    <AccountCard title="Profile">
      {!summary.emailConfirmed ? (
        <div role="status" className="mb-6 flex gap-3 border-l-2 border-[color:var(--accent-primary)] py-2 pl-4 text-body-s">
          <ShieldAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-accent" />
          <p className="text-secondary">
            <span className="font-semibold text-primary">Confirm your account.</span> Check your email for the confirmation link.
          </p>
        </div>
      ) : null}
      <dl className="border-b border-[color:var(--border-subtle)]">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1 border-t border-[color:var(--border-subtle)] py-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6">
            <dt className="text-label">{row.label}</dt>
            <dd className="break-words text-body-m text-primary" data-testid={row.label === 'Email' ? 'account-email' : undefined}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      <SignOutButton className="mt-8 sm:max-w-xs" />
    </AccountCard>
  )
}
