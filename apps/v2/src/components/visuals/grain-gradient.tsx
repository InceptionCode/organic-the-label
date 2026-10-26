import type { CSSProperties } from 'react'
import { GrainGradient as PaperGrainGradient } from '@paper-design/shaders-react'

// Brand-colored animated grain gradient (dark: black base, red + beige accents), ported from
// v1 ui-components/grain-gradient-hero-section.tsx. Only the shader layer lives here; the hero
// copy and CTA belong to the page section that uses it. v1 pinned it `position: fixed` behind the
// page; here it fills its LazyVisual box unless a style override is passed.
export type GrainGradientProps = { style?: CSSProperties; className?: string }

export default function GrainGradient({ style, className }: GrainGradientProps) {
  return (
    <PaperGrainGradient
      className={className}
      colorBack="#171717"
      colors={['#E03D2A', '#D4C4A8', '#C8351F', '#8A7250']}
      softness={0.6}
      intensity={0.45}
      noise={0.3}
      speed={0.6}
      shape="corners"
      style={{ position: 'absolute', inset: 0, ...style }}
    />
  )
}
