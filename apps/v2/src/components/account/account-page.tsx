import type { ReactNode } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { accountQueries } from '~/queries/account'
import { AccountLibrary } from './account-library'
import { AccountProfile } from './account-profile'

export function AccountLayout({ profile, library }: { profile: ReactNode; library: ReactNode }) {
  return (
    <div className="content-container pt-10 pb-16 md:pt-16 md:pb-24">
      <header className="mb-10 md:mb-14">
        <p className="text-label mb-4">Your account</p>
        <h1 className="text-display-l text-primary">ACCOUNT</h1>
      </header>
      {/* Flat sections stacked on the canvas: profile, then library (each with its label column on lg). */}
      <div className="hairline-b">
        {profile}
        {library}
      </div>
    </div>
  )
}

export function AccountPage() {
  const { data: summary } = useSuspenseQuery(accountQueries.summary())
  const { data: items } = useSuspenseQuery(accountQueries.ownedProducts())
  const { data: resources } = useSuspenseQuery(accountQueries.ownedResources())
  return (
    <AccountLayout
      profile={<AccountProfile summary={summary} />}
      library={<AccountLibrary items={items} resources={resources} />}
    />
  )
}

function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-[2px] bg-surface-2 motion-reduce:animate-none ${className}`} />
}

/** Flat section placeholder in the same label-column grid as AccountCard. */
function CardSkeleton({ children }: { children: ReactNode }) {
  return (
    <div className="hairline-t grid gap-6 py-10 md:py-14 lg:grid-cols-12 lg:gap-8">
      <Bar className="h-8 w-32 lg:col-span-4" />
      <div className="lg:col-span-8">{children}</div>
    </div>
  )
}

export function AccountSkeleton() {
  return (
    <AccountLayout
      profile={
        <CardSkeleton>
          <div className="space-y-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <Bar className="h-3 w-20" />
                <Bar className="h-5 w-48 max-w-full" />
              </div>
            ))}
          </div>
          <Bar className="mt-8 h-11 w-full" />
        </CardSkeleton>
      }
      library={
        <CardSkeleton>
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Bar className="size-16 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Bar className="h-3 w-20" />
                  <Bar className="h-4 w-3/4" />
                  <Bar className="h-3 w-28" />
                </div>
              </div>
            ))}
          </div>
        </CardSkeleton>
      }
    />
  )
}
