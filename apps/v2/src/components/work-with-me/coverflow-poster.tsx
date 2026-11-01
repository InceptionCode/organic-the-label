import { Play } from 'lucide-react'
import { slideLabel, type CoverflowProps } from './post-slides'

/**
 * Usable fallback for the coverflow (SSR, reduced motion, Save-Data, before the live carousel
 * loads): a horizontal scroll-snap row of the same slide buttons, so every post stays reachable.
 */
export function CoverflowPoster({ slides, onActivate, label }: CoverflowProps) {
  return (
    <div role="region" aria-label={label} className="w-full">
      <ul className="wwm-snap -mx-4 flex gap-4 overflow-x-auto px-4 py-10 sm:mx-0 sm:px-0">
        {slides.map((slide, index) => (
          <li key={slide.key} className="shrink-0">
            <button
              type="button"
              aria-label={slideLabel(slide, index, slides.length)}
              onClick={() => onActivate(slide)}
              className="group relative block aspect-square w-[clamp(168px,24vw,300px)] cursor-pointer overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(224,61,42,0.16)] bg-surface-2 shadow-lg-premium outline-none transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] motion-reduce:transition-none"
            >
              <img src={slide.src} alt="" width={300} height={300} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
              <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/45 to-transparent to-55% opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                <span className="flex size-14 items-center justify-center rounded-full bg-[color:var(--accent-primary)] shadow-glow">
                  <Play className="ml-[3px] size-6 text-white" />
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
