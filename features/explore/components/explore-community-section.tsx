import type { ExploreSectionMetadata } from '@/features/explore/types';
import { MOCK_COMMUNITY } from '@/features/explore/mock/explore-mock-data';

type ExploreCommunitySectionProps = {
  metadata: ExploreSectionMetadata;
};

export function ExploreCommunitySection({ metadata }: ExploreCommunitySectionProps) {
  return (
    <div>
      <h2 id={`${metadata.id}-heading`} className="text-h3 text-primary font-semibold mb-4">
        Community pulse
      </h2>
      <ul className="space-y-3" aria-label="Recent discussions">
        {MOCK_COMMUNITY.map((item) => (
          <li key={item.id}>
            <div
              className="card-base rounded-lg p-4 transition-soft hover:bg-surface-2"
              style={{ boxShadow: 'var(--shadow-sm-premium)' }}
            >
              <p className="text-body-m text-primary">{item.snippet}</p>
              <p className="meta mt-2">
                <span className="font-medium text-secondary">{item.author}</span>
                <span className="text-muted"> · {item.timeAgo}</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
