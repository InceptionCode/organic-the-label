import type { CSSProperties } from 'react'

/** v1 fixed ambient layers: drifting red and beige radials, grain at 0.03 (220px tile), vignette. */
export function AmbientBackground() {
  return (
    <>
      <div
        aria-hidden="true"
        className="wwm-drift pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% -6%, rgba(224,61,42,0.22) 0%, transparent 68%), radial-gradient(ellipse 45% 40% at 6% 32%, rgba(224,61,42,0.10) 0%, transparent 60%), radial-gradient(ellipse 50% 45% at 96% 70%, rgba(212,196,168,0.10) 0%, transparent 62%)',
        }}
      />
      <div
        aria-hidden="true"
        className="grain fixed z-0"
        style={{ '--grain-opacity': 0.03, backgroundSize: '220px' } as CSSProperties}
      />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" style={{ boxShadow: 'inset 0 0 220px 60px rgba(0,0,0,0.55)' }} />
    </>
  )
}
