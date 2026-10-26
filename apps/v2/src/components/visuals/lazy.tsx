import type { CSSProperties } from 'react'
import { LazyVisual } from '~/ui/lazy-visual'
import type { EmailVisualProps } from './email-visual'
import type { ParticlePortraitProps } from './particle-portrait'

// The ONLY entry points to the heavy visuals. Each module (ogl, three, @paper-design/shaders-react)
// is referenced solely through `load: () => import(...)`; type-only imports above are erased.
// Posters are CSS gradients that approximate each visual's resting frame.

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

function Poster({ background, grain = 0.03 }: { background: string; grain?: number }) {
  const fill: CSSProperties = { position: 'absolute', inset: 0 }
  return (
    <div aria-hidden="true" data-poster style={{ ...fill, background }}>
      <div style={{ ...fill, backgroundImage: GRAIN, opacity: grain, mixBlendMode: 'screen' }} />
    </div>
  )
}

const AURORA_POSTER =
  'radial-gradient(ellipse 70% 28% at 50% 52%, rgba(224,61,42,0.42), transparent 70%), radial-gradient(ellipse 45% 16% at 30% 46%, rgba(212,196,168,0.10), transparent 70%), #171717'
const EMAIL_POSTER =
  'radial-gradient(circle at 50% 50%, rgba(224,61,42,0.55) 0 2%, transparent 3%), repeating-radial-gradient(circle at 50% 50%, transparent 0 46px, rgba(217,199,167,0.10) 47px 48px, transparent 49px 70px), radial-gradient(ellipse 85% 85% at 50% 50%, transparent 28%, rgba(7,7,7,0.52) 100%)'
const PORTRAIT_POSTER =
  'radial-gradient(ellipse 40% 46% at 55% 46%, rgba(217,199,167,0.20), transparent 70%), radial-gradient(ellipse 60% 60% at 55% 50%, rgba(131,25,25,0.38), transparent 75%), radial-gradient(ellipse 78% 82% at 55% 48%, transparent 30%, rgba(0,0,0,0.5) 100%)'
const GRAIN_POSTER =
  'radial-gradient(circle at 0% 0%, rgba(224,61,42,0.55), transparent 45%), radial-gradient(circle at 100% 0%, rgba(212,196,168,0.30), transparent 40%), radial-gradient(circle at 100% 100%, rgba(200,53,31,0.45), transparent 45%), radial-gradient(circle at 0% 100%, rgba(138,114,80,0.35), transparent 40%), #171717'

type BoxProps = { className?: string }

export function LazyAuroraWaves({ className, ...props }: BoxProps & { speed?: number; glow?: number; resolutionScale?: number }) {
  return (
    <LazyVisual
      className={className}
      load={() => import('./aurora-waves')}
      poster={<Poster background={AURORA_POSTER} grain={0} />}
      props={props}
    />
  )
}

export function LazyEmailVisual({ className, ...props }: BoxProps & Omit<EmailVisualProps, 'className'>) {
  return (
    <LazyVisual
      className={className}
      load={() => import('./email-visual')}
      poster={<Poster background={EMAIL_POSTER} grain={0.022} />}
      props={props}
    />
  )
}

export function LazyParticlePortrait({ className, ...props }: BoxProps & Omit<ParticlePortraitProps, 'className'>) {
  return (
    <LazyVisual
      className={className}
      load={() => import('./particle-portrait')}
      poster={<Poster background={PORTRAIT_POSTER} />}
      props={props}
    />
  )
}

export function LazyGrainGradient({ className }: BoxProps) {
  return (
    <LazyVisual
      className={className}
      load={() => import('./grain-gradient')}
      poster={<Poster background={GRAIN_POSTER} grain={0.05} />}
      props={{}}
    />
  )
}
