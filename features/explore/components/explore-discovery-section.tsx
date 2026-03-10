import type { ExploreSectionMetadata } from '@/features/explore/types';
import { MOCK_DISCOVERY_PROFILES } from '@/features/explore/mock/explore-mock-data';

type ExploreDiscoverySectionProps = {
  metadata: ExploreSectionMetadata;
};

export function ExploreDiscoverySection({ metadata }: ExploreDiscoverySectionProps) {
  return (
    <div>
      <h2 id={`${metadata.id}-heading`} className="text-h3 text-primary font-semibold mb-4">
        Find producers and artists
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Profiles">
        {MOCK_DISCOVERY_PROFILES.map((profile) => (
          <li key={profile.id}>
            <div
              className="card-base rounded-lg p-4 transition-soft hover:bg-surface-2 flex flex-col items-center text-center"
              style={{ boxShadow: 'var(--shadow-sm-premium)' }}
            >
              <div
                className="size-12 rounded-full bg-surface-3 flex items-center justify-center text-secondary text-body-m font-semibold mb-2"
                aria-hidden
              >
                {profile.name.charAt(0)}
              </div>
              <span className="text-h5 text-primary font-semibold">{profile.name}</span>
              <span className="meta mt-0.5">{profile.tagline}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
