import type { ReactNode } from 'react'

export type FormPagePoint = { title?: string; body: string }

type SplitFormPageProps = {
  title: ReactNode
  intro: ReactNode
  /** The page's points (what's inside, benefits) as plain hairline rows. */
  points?: readonly FormPagePoint[]
  /** Heading over the points ("What's inside"). */
  pointsHeading?: string
  /** Small closing line under the points. */
  note?: ReactNode
  /** The unboxed form (or its success state). */
  children: ReactNode
}

/**
 * Split layout shared by /contact, /newsletter and /free (Work With Me's closing section, on the
 * black canvas): headline, intro and points on the left, the form on the right from lg. Below lg it
 * stacks headline, form, then points, so the primary action comes before the supporting list.
 */
export function SplitFormPage({ title, intro, points, pointsHeading, note, children }: SplitFormPageProps) {
  const hasPoints = (points?.length ?? 0) > 0 || note
  return (
    <section className="bg-canvas section-y-standard">
      <div className="content-container grid gap-x-8 gap-y-12 lg:grid-cols-12 lg:gap-y-14">
        {/* Without points (contact), the headline and intro stay pinned beside the form as it scrolls. */}
        <header className={hasPoints ? 'lg:col-span-5' : 'lg:sticky lg:top-[calc(72px+3rem)] lg:col-span-5 lg:row-span-2 lg:self-start'}>
          <h1 className="text-display-l text-primary text-balance">{title}</h1>
          <div className="mt-6 max-w-[44ch] text-body-l text-secondary">{intro}</div>
        </header>

        <div className="lg:col-span-6 lg:col-start-7 lg:row-span-2 lg:row-start-1">{children}</div>

        {hasPoints ? (
          <div className="lg:col-span-5">
            {pointsHeading ? <h2 className="mb-5 text-h4 text-primary">{pointsHeading}</h2> : null}
            {points?.length ? (
              <ul className="border-b border-[color:var(--border-subtle)]">
                {points.map((point) => (
                  <li key={point.title ?? point.body} className="border-t border-[color:var(--border-subtle)] py-4">
                    {point.title ? <p className="text-body-m font-medium text-primary">{point.title}</p> : null}
                    <p className={point.title ? 'mt-1 text-body-s text-secondary' : 'text-body-m text-secondary'}>{point.body}</p>
                  </li>
                ))}
              </ul>
            ) : null}
            {note ? <p className="mt-5 text-label">{note}</p> : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}

/** Flat success state that replaces a form: red left bar, Bebas line, plain text, next action link. */
export function FormSuccess({
  title,
  children,
  headingRef,
  action,
}: {
  title: string
  children: ReactNode
  headingRef?: (el: HTMLHeadingElement | null) => void
  action?: ReactNode
}) {
  return (
    <div role="status" className="os-swap-in border-l-2 border-[color:var(--accent-primary)] py-2 pl-6">
      <h2 ref={headingRef} tabIndex={-1} className="text-h2 text-primary outline-none">
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-body-m text-secondary">{children}</div>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
