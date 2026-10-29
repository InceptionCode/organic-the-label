import { buttonClasses } from '~/ui/button'

export function CtaBand() {
  return (
    <section aria-labelledby="wwm-cta-title" className="content-container-xl section-y-standard">
      <div
        className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[rgba(224,61,42,0.3)] px-8 py-16 text-center md:py-24"
        style={{ background: 'linear-gradient(160deg, #1E1E1E 0%, #171717 60%, #140b0a 100%)' }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 55% 70% at 50% -10%, rgba(224,61,42,0.32) 0%, transparent 62%), radial-gradient(ellipse 40% 50% at 50% 120%, rgba(212,196,168,0.10) 0%, transparent 60%)',
          }}
        />
        <div className="relative flex flex-col items-center gap-6">
          <p className="eyebrow text-accent-secondary tracking-[0.22em]">Let&apos;s build</p>
          <h2 id="wwm-cta-title" className="font-heading uppercase text-primary text-[clamp(2.75rem,8vw,6rem)] leading-[0.92] tracking-[0.01em]">
            Get started
            <br />
            <span className="text-accent">today</span>
          </h2>
          <p className="max-w-[42ch] text-body-m text-secondary">Bring the demo, the reference, or just the idea. We&apos;ll build the record.</p>
          <div className="wwm-pulse">
            <a href="#work-with-me-inquiry" className={buttonClasses({ size: 'lg', className: 'shadow-glow' })}>
              Start a project
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
