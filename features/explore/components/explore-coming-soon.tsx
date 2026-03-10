import { Container } from '@/ui-components/container';

/**
 * Premium default state when explorePageEnabled is false.
 */
export function ExploreComingSoon() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-16 px-4">
      <Container>
        <div
          className="card-base rounded-xl max-w-2xl mx-auto p-8 md:p-12 text-center"
          style={{ boxShadow: 'var(--shadow-md-premium)' }}
        >
          <h1 className="text-display-m text-primary font-semibold mb-4">
            Explore is coming
          </h1>
          <p className="text-body-l text-muted mb-8">
            Personalized discovery, recommendations, and community are in the works.
            You’ll see curated producer news, highlights, and new resources here.
          </p>
          <div className="flex flex-wrap justify-center gap-2" aria-hidden>
            <span className="eyebrow px-3 py-1.5 rounded-full bg-surface-2 text-muted border border-subtle">
              Personalized recommendations
            </span>
            <span className="eyebrow px-3 py-1.5 rounded-full bg-surface-2 text-muted border border-subtle">
              Producer news
            </span>
            <span className="eyebrow px-3 py-1.5 rounded-full bg-surface-2 text-muted border border-subtle">
              Community
            </span>
            <span className="eyebrow px-3 py-1.5 rounded-full bg-surface-2 text-muted border border-subtle">
              New resources
            </span>
          </div>
        </div>
      </Container>
    </div>
  );
}
