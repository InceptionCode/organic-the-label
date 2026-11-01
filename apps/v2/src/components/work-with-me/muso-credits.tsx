import { BadgeCheck, ExternalLink } from 'lucide-react'
import { MUSO_PROFILE_URL, MUSO_SCREENSHOT_URL } from '~/lib/work-with-me-content'

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]'

/** The Muso.ai discography, unboxed: the screenshot (radius 0) links out, the copy and link sit below. */
export function MusoCredits() {
  return (
    <div>
      <a
        href={MUSO_PROFILE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Verified on Muso.ai: open the full verified credits"
        className={`group relative block aspect-[915/950] overflow-hidden bg-surface-1 active:opacity-90 ${focusRing}`}
      >
        <img
          src={MUSO_SCREENSHOT_URL}
          alt="JUICEMAN's verified production credits, as listed on Muso.ai"
          width={915}
          height={950}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover object-top transition-transform duration-500 ease-[var(--ease-spring)] group-hover:scale-[1.02] motion-reduce:transition-none"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(7,7,7,0.85) 0%, rgba(7,7,7,0.2) 35%, transparent 60%)' }}
        />
        <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4">
          <span className="inline-flex items-center gap-1.5 text-label text-primary">
            <BadgeCheck className="size-4" aria-hidden="true" />
            Verified on Muso.ai
          </span>
          <ExternalLink className="size-4 shrink-0 text-primary" aria-hidden="true" />
        </span>
      </a>
      <div className="mt-5 flex flex-col gap-1.5">
        <p className="text-h4 text-primary">Full production discography</p>
        <p className="max-w-[52ch] text-body-s text-secondary">Every mixing, mastering, and production credit is verified on Muso.ai</p>
        <a
          href={MUSO_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`link-underline mt-1 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-sm text-body-s text-primary active:opacity-70 ${focusRing}`}
        >
          View credits on Muso.ai
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  )
}
