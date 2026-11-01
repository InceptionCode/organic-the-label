import { lazy, Suspense, useEffect, useState } from 'react'
import { whenLoadedAndIdle } from '~/lib/after-load'
import { markSplashSeen, readSplashEnv, shouldShowSplash } from '~/lib/splash-gate'

const SessionSplash = lazy(() => import('./session-splash').then((m) => ({ default: m.SessionSplash })))

/**
 * Phase 07.7. Client-only gate for the once-per-session splash. Renders nothing on the server and on
 * first paint; after `load` and idle it decides (see `shouldShowSplash`) and only then fetches the
 * overlay chunk, which in turn is the only thing that requests frames.
 */
export function SplashGate() {
  const [open, setOpen] = useState(false)

  useEffect(() => whenLoadedAndIdle(() => setOpen(shouldShowSplash(readSplashEnv()))), [])

  if (!open) return null
  return (
    <Suspense fallback={null}>
      <SessionSplash
        onClosed={() => {
          markSplashSeen()
          setOpen(false)
        }}
      />
    </Suspense>
  )
}
