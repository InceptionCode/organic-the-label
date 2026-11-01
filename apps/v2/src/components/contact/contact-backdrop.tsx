import type { CSSProperties } from 'react'

// Decorative layers (v1 contact page). v1 used position: fixed; v2 keeps them absolute inside the
// page wrapper so they never overlap the sticky header or cause horizontal overflow.
export function ContactBackdrop() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 50% 35% at 50% -8%, rgba(224,61,42,0.09) 0%, transparent 70%), radial-gradient(ellipse 30% 25% at 20% 90%, rgba(138,114,80,0.06) 0%, transparent 60%)',
        }}
      />
      <div aria-hidden="true" className="grain z-0" style={{ '--grain-opacity': 0.02 } as CSSProperties} />
    </>
  )
}
