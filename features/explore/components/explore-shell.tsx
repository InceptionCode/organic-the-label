import type { ExploreFeatureFlags } from '@/features/explore/config/explore-feature-flags';
import { EXPLORE_SECTIONS } from '@/features/explore/config/explore-sections';
import { ExploreSectionWrapper } from '@/features/explore/components/explore-section-wrapper';
import { ExploreHero } from '@/features/explore/components/explore-hero';
import { ExploreEmailSignup } from '@/features/explore/components/explore-email-signup';
import { ExploreMembershipUpsell } from '@/features/explore/components/explore-membership-upsell';
import { ExploreNewsSection } from '@/features/explore/components/explore-news-section';
import { ExploreCommunitySection } from '@/features/explore/components/explore-community-section';
import { ExploreDiscoverySection } from '@/features/explore/components/explore-discovery-section';
import { ExploreResourcesSection } from '@/features/explore/components/explore-resources-section';
import type { ExploreSectionMetadata } from '@/features/explore/types';

type ExploreShellProps = {
  flags: ExploreFeatureFlags;
};

const SECTION_COMPONENTS = {
  exploreHeroEnabled: ExploreHero,
  exploreEmailSignupEnabled: ExploreEmailSignup,
  exploreMembershipEnabled: ExploreMembershipUpsell,
  exploreNewsEnabled: ExploreNewsSection,
  exploreCommunityEnabled: ExploreCommunitySection,
  exploreDiscoveryEnabled: ExploreDiscoverySection,
  exploreResourcesEnabled: ExploreResourcesSection,
  explorePageEnabled: null
} as const;

export function ExploreShell({ flags }: ExploreShellProps) {
  const visibleSections = EXPLORE_SECTIONS.filter((config) => flags[config.flagKey]);
  const hasAnySection = visibleSections.length > 0;

  return (
    <div className="py-8">
      {hasAnySection ? (
        <div className="space-y-0">
          {visibleSections.map((config) => {
            const metadata: ExploreSectionMetadata = {
              id: config.id,
              label: config.label,
              trackingKey: config.trackingKey,
            };
            const SectionComponent = SECTION_COMPONENTS[config.flagKey];
            const variant = config.flagKey === 'exploreHeroEnabled' ? 'hero' : 'standard';

            return (
              <ExploreSectionWrapper key={config.id} metadata={metadata} variant={variant}>
                {SectionComponent && <SectionComponent metadata={metadata} />}
              </ExploreSectionWrapper>
            );
          })}
        </div>
      ) : (
        <div className="content-container py-12 text-center">
          <p className="text-body-m text-muted">More sections coming soon.</p>
        </div>
      )}
    </div>
  );
}
