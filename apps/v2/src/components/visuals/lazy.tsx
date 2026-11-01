import type { CSSProperties } from 'react'
import { LazyVisual } from '~/ui/lazy-visual'
import type { EmailVisualProps } from './email-visual'
import type { GrainGradientProps } from './grain-gradient'
import type { LiveWaveformProps } from './live-waveform'
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
  'radial-gradient(ellipse 70% 28% at 50% 52%, rgba(179,25,25,0.42), transparent 70%), radial-gradient(ellipse 45% 16% at 30% 46%, rgba(217,199,167,0.10), transparent 70%), #070707'
const EMAIL_POSTER =
  'radial-gradient(circle at 50% 50%, rgba(179,25,25,0.55) 0 2%, transparent 3%), repeating-radial-gradient(circle at 50% 50%, transparent 0 46px, rgba(217,199,167,0.10) 47px 48px, transparent 49px 70px), radial-gradient(ellipse 85% 85% at 50% 50%, transparent 28%, rgba(7,7,7,0.52) 100%)'
const PORTRAIT_POSTER =
  'radial-gradient(ellipse 40% 46% at 55% 46%, rgba(217,199,167,0.20), transparent 70%), radial-gradient(ellipse 60% 60% at 55% 50%, rgba(131,25,25,0.38), transparent 75%), radial-gradient(ellipse 78% 82% at 55% 48%, transparent 30%, rgba(0,0,0,0.5) 100%)'
const GRAIN_POSTER =
  'radial-gradient(circle at 0% 0%, rgba(179,25,25,0.55), transparent 45%), radial-gradient(circle at 100% 0%, rgba(217,199,167,0.30), transparent 40%), radial-gradient(circle at 100% 100%, rgba(179,25,25,0.45), transparent 45%), radial-gradient(circle at 0% 100%, rgba(138,114,80,0.35), transparent 40%), #070707'

// Static frame of the live waveform: the same harmonics at time 0, tapered at both edges.
const WAVE_PATH = Array.from({ length: 121 }, (_, i) => {
  const t = i / 120
  const v =
    0.55 * Math.sin(t * 9) + 0.25 * Math.sin(t * 23) + 0.12 * Math.sin(t * 47) + 0.08 * Math.sin(t * 3)
  const y = 50 + v * 0.55 * 42 * Math.sin(Math.PI * t) ** 2
  return `${i === 0 ? 'M' : 'L'}${(t * 1000).toFixed(1)} ${y.toFixed(2)}`
}).join(' ')

function WaveformPoster() {
  return (
    <svg aria-hidden="true" data-poster viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
      <path d={WAVE_PATH} fill="none" stroke="rgba(179,25,25,0.55)" strokeWidth={2.5} vectorEffect="non-scaling-stroke" transform="translate(0 1)" />
      <path d={WAVE_PATH} fill="none" stroke="rgba(247,243,235,0.7)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

type BoxProps = { className?: string }

export function LazyLiveWaveform({ className, ...props }: BoxProps & Omit<LiveWaveformProps, 'className'>) {
  return (
    <LazyVisual className={className} load={() => import('./live-waveform')} poster={<WaveformPoster />} props={props} />
  )
}

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

/** Wordmark-state poster: the name set large in the heading face, beige on the portrait glow. */
function WordmarkPoster({ text }: { text: string }) {
  return (
    <div aria-hidden="true" data-poster style={{ position: 'absolute', inset: 0 }}>
      <Poster background={PORTRAIT_POSTER} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(4rem, 11vw, 10rem)',
          letterSpacing: '0.04em',
          color: 'rgba(217,199,167,0.16)',
          userSelect: 'none',
        }}
      >
        {text}
      </div>
    </div>
  )
}

export function LazyParticlePortrait({
  className,
  media,
  ...props
}: BoxProps & Omit<ParticlePortraitProps, 'className'> & { media?: string }) {
  // The poster matches the state the data implies: the wordmark when there is no portrait image.
  const poster = !props.imageUrl && props.wordmark ? <WordmarkPoster text={props.wordmark} /> : <Poster background={PORTRAIT_POSTER} />
  return (
    <LazyVisual className={className} load={() => import('./particle-portrait')} poster={poster} props={props} media={media} />
  )
}

export function LazyGrainGradient({ className, ...props }: BoxProps & Omit<GrainGradientProps, 'className' | 'style'>) {
  return (
    <LazyVisual
      className={className}
      load={() => import('./grain-gradient')}
      poster={<Poster background={GRAIN_POSTER} grain={0.05} />}
      props={props}
    />
  )
}
