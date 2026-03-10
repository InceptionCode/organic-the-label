import type { ExploreSectionMetadata } from '@/features/explore/types';
import { MOCK_NEWS } from '@/features/explore/mock/explore-mock-data';

type ExploreNewsSectionProps = {
  metadata: ExploreSectionMetadata;
};

export function ExploreNewsSection({ metadata }: ExploreNewsSectionProps) {
  return (
    <div>
      <h2 id={`${metadata.id}-heading`} className="text-h3 text-primary font-semibold mb-4">
        Recent news from producers & artists
      </h2>
      <ul className="space-y-3" aria-label="News">
        {MOCK_NEWS.map((item) => (
          <li key={item.id}>
            <article
              className="card-base rounded-lg p-4 transition-soft hover:bg-surface-2"
              style={{ boxShadow: 'var(--shadow-sm-premium)' }}
            >
              <span className="meta text-muted">{item.date}</span>
              <h3 className="text-h5 text-primary mt-1">{item.title}</h3>
              <p className="text-body-s text-muted mt-1">{item.excerpt}</p>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
