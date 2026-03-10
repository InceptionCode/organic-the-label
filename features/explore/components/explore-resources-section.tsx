import type { ExploreSectionMetadata } from '@/features/explore/types';
import { MOCK_RESOURCES } from '@/features/explore/mock/explore-mock-data';

type ExploreResourcesSectionProps = {
  metadata: ExploreSectionMetadata;
};

export function ExploreResourcesSection({ metadata }: ExploreResourcesSectionProps) {
  return (
    <div>
      <h2 id={`${metadata.id}-heading`} className="text-h3 text-primary font-semibold mb-4">
        Recent kits, packs & resources
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Resources">
        {MOCK_RESOURCES.map((item) => (
          <li key={item.id}>
            <div
              className="card-base rounded-lg p-4 transition-soft hover:bg-surface-2"
              style={{ boxShadow: 'var(--shadow-sm-premium)' }}
            >
              <span className="eyebrow text-muted">{item.category}</span>
              <h3 className="text-h5 text-primary mt-1">{item.title}</h3>
              {item.price != null && (
                <span className="price-text text-primary mt-2 block">{item.price}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
