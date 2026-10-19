import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

// TEMPORARY token swatch page (phase 00.8). Delete at the end of phase 03.

const COLOR_TOKENS = [
  'bg-canvas', 'bg-subtle', 'bg-elevated', 'bg-overlay',
  'surface-1', 'surface-2', 'surface-3',
  'text-primary', 'text-secondary', 'text-muted', 'text-disabled',
  'border-subtle', 'border-default', 'border-strong', 'border-focus',
  'accent-primary', 'accent-primary-hover', 'accent-primary-soft', 'accent-contrast',
  'accent-secondary', 'accent-secondary-hover', 'accent-secondary-soft',
  'success', 'warning', 'danger', 'info',
]

const TYPE_SCALE = [
  'text-display-xl', 'text-display-l', 'text-display-m',
  'text-h1', 'text-h2', 'text-h3', 'text-h4', 'text-h5',
  'text-body-l', 'text-body-m', 'text-body-s', 'text-caption', 'eyebrow', 'meta', 'price-text',
]

const SHADOWS = ['shadow-sm-premium', 'shadow-md-premium', 'shadow-lg-premium', 'shadow-glow']
const RADII = ['rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl']

export const Route = createFileRoute('/dev-tokens')({
  head: () => ({ meta: [{ title: 'Tokens' }, { name: 'robots', content: 'noindex, nofollow' }] }),
  component: DevTokens,
})

function DevTokens() {
  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement)
    setValues(Object.fromEntries(COLOR_TOKENS.map((t) => [t, styles.getPropertyValue(`--${t}`).trim()])))
  }, [])

  return (
    <div className="content-container section-y-standard flex flex-col gap-12">
      <header className="flex flex-col gap-2">
        <p className="eyebrow">Phase 00.8</p>
        <h1 className="text-display-m text-primary">DESIGN TOKENS</h1>
        <p className="text-body-m text-secondary">
          Body is Inter, headings are Bebas Neue. Values are read live from the document.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-h3 text-primary">COLORS</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {COLOR_TOKENS.map((token) => (
            <li key={token} className="card-base card-padding-sm flex flex-col gap-2">
              <span
                className="h-12 w-full rounded-md border border-default"
                style={{ background: `var(--${token})` }}
              />
              <span className="text-caption text-primary">--{token}</span>
              <span className="meta break-all">{values[token] ?? ''}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h3 text-primary">TYPE SCALE</h2>
        <ul className="flex flex-col gap-3">
          {TYPE_SCALE.map((cls) => (
            <li key={cls} className="flex flex-col gap-1 border-b border-subtle pb-3">
              <span className="meta">.{cls}</span>
              <span className={`${cls} text-primary`}>Premium sounds for modern producers</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="text-h3 text-primary">SHADOWS</h2>
          {SHADOWS.map((cls) => (
            <div key={cls} className={`${cls} bg-surface-1 rounded-lg p-4 text-body-s text-secondary`}>
              .{cls}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-h3 text-primary">RADII AND SURFACES</h2>
          {RADII.map((cls) => (
            <div key={cls} className={`${cls} bg-surface-2 border border-default p-4 text-body-s text-secondary`}>
              .{cls}
            </div>
          ))}
          <div className="card-glass rounded-lg p-6 text-body-s text-secondary">.card-glass (hover me)</div>
          <div className="card-base card-padding-md card-hover text-body-s text-secondary">.card-base .card-hover</div>
          <p className="text-body-m">
            <a href="#top">Plain link</a> · <span className="link">.link</span> ·{' '}
            <span className="link-muted">.link-muted</span>
          </p>
        </div>
      </section>
    </div>
  )
}
