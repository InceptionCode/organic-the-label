import type { CSSProperties } from 'react'
import { GrainGradient as PaperGrainGradient } from '@paper-design/shaders-react'

// Brand-colored animated grain gradient (ink base, red + sand accents), ported from
// v1 ui-components/grain-gradient-hero-section.tsx. Only the shader layer lives here; the hero
// copy and CTA belong to the page section that uses it. v1 pinned it `position: fixed` behind the
// page; here it fills its LazyVisual box unless a style override is passed.
export type GrainGradientProps = {
  style?: CSSProperties
  className?: string
  /** Defaults are the hero values; the store collection header passes its own (pages/store.md). */
  colors?: string[]
  softness?: number
  intensity?: number
  noise?: number
}

export default function GrainGradient({
  style,
  className,
  colors = ['#B31919', '#D9C7A7', '#831919', '#5E4C36'],
  softness = 0.6,
  intensity = 0.45,
  noise = 0.3,
}: GrainGradientProps) {
  return (
    <PaperGrainGradient
      className={className}
      colorBack="#070707"
      colors={colors}
      softness={softness}
      intensity={intensity}
      noise={noise}
      speed={0.6}
      shape="corners"
      style={{ position: 'absolute', inset: 0, ...style }}
    />
  )
}
