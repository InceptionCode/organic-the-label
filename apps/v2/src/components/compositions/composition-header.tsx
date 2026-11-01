import { cn } from '~/ui/cn'

// v1 used an em dash in the third benefit; it is a comma now (pages/compositions.md).
const BENEFITS = ['Early access to new drops', 'Free samples and loops', 'Exclusive deals, straight to your inbox', 'No spam, ever']

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]'

/**
 * Flat header: intro on the left; the newsletter pitch on the right from lg as an unboxed block.
 * Its CTA is an outline button so Download stays the page's one red action.
 */
export function CompositionHeader() {
  return (
    <header className="content-container grid gap-10 pb-10 pt-10 md:pt-14 lg:grid-cols-12 lg:gap-12 lg:pb-14">
      <div className="lg:col-span-7">
        <p className="mb-4 text-label">Free loops</p>
        <h1 className="text-display-l text-primary">Compositions</h1>
        <p className="mt-6 max-w-[56ch] text-body-l text-secondary">
          Original sample and loop previews straight from Instagram and YouTube. Hear the idea in context, then download the
          full loop with its terms of use as one zip. No account, no redirect.
        </p>
      </div>

      <aside aria-label="Newsletter" className="lg:col-span-5 lg:self-end">
        <p className="text-h4 text-primary">Get loops in your inbox</p>
        <ul className="hairline-t mt-4 grid grid-cols-1 sm:grid-cols-2 sm:gap-x-6">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="hairline-b flex min-h-11 items-center py-2 text-body-s text-secondary">
              {benefit}
            </li>
          ))}
        </ul>
        {/* Plain anchor: /newsletter is built in parallel (05.11), so it is not in the typed route tree yet. */}
        <a
          href="/newsletter"
          className={cn(
            'mt-6 inline-flex h-12 items-center justify-center rounded-[2px] border border-[color:var(--border-strong)] px-6 text-[0.9375rem] font-medium text-primary no-underline transition-[border-color,background-color,transform] duration-150 hover:border-[color:var(--text-primary)] hover:bg-[color:color-mix(in_srgb,var(--text-primary)_4%,transparent)] active:scale-[0.98]',
            focusRing,
          )}
        >
          Join the newsletter
        </a>
      </aside>
    </header>
  )
}
