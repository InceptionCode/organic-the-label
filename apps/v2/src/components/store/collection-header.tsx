import type { CSSProperties } from 'react'
import { LazyGrainGradient } from '~/components/visuals/lazy'

const STATS = ['1,000+ sounds', 'Real tools', 'Instant downloads']

const enter = (from: number, duration: number, delay: number) =>
  ({ '--rise-from': `${from}px`, '--enter-duration': `${duration}s`, '--enter-delay': `${delay}s` }) as CSSProperties

/**
 * Store header: the grain shader as the page's brand visual, full-bleed and fading into the canvas,
 * with the headline anchored bottom-left. One load sequence (os-enter); stats are plain text.
 */
export function CollectionHeader() {
  return (
    <section className="relative flex min-h-[clamp(320px,40svh,440px)] flex-col justify-end overflow-hidden bg-canvas lg:min-h-[clamp(380px,46svh,560px)]">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <LazyGrainGradient
          className="absolute inset-0"
          colors={['#B31919', '#D9C7A7', '#831919', '#2A1410']}
          softness={0.6}
          intensity={0.35}
          noise={0.3}
        />
        {/* Keeps the copy on near-black wherever the shader drifts, and fades the band into the page. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, var(--bg-canvas) 8%, color-mix(in srgb, var(--bg-canvas) 70%, transparent) 45%, color-mix(in srgb, var(--bg-canvas) 25%, transparent) 100%)',
          }}
        />
      </div>

      <div className="content-container relative z-10 pb-10 pt-16 md:pb-12 lg:pb-14">
        <h1 className="os-enter max-w-[18ch] text-display-l text-primary" style={enter(32, 0.65, 0.1)}>
          PURE ORGANIC SONICS FOR YA HEAD TOP!
        </h1>
        <p className="os-enter mt-4 text-h2 text-secondary" style={enter(20, 0.6, 0.22)}>
          PREMIUM TOOLS FOR MODERN PRODUCERS.
        </p>
        <p className="os-enter mt-5 max-w-[56ch] text-body-m text-secondary" style={enter(14, 0.55, 0.32)}>
          Curated beats, kits, and sound design for late-night sessions. Built to sound expensive straight out of the box.
        </p>
        <ul className="os-enter mt-6 flex flex-wrap items-center gap-x-5 gap-y-1 text-label sm:gap-x-0" style={enter(10, 0.5, 0.42)}>
          {STATS.map((stat, i) => (
            <li key={stat} className={i > 0 ? 'sm:ml-4 sm:border-l sm:border-[color:var(--border-strong)] sm:pl-4' : undefined}>
              {stat}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
