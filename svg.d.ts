// Type declarations for SVG static imports used with next/image.
// SVGs in /public imported as modules resolve to StaticImageData
// (width, height, src) so they can be passed directly to <Image src={...} />.
declare module '*.svg' {
  import type { StaticImageData } from 'next/image'
  const content: StaticImageData
  export default content
}
