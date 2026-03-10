import { MembershipCtaHero } from '@/app/components/membership-cta-hero';

type MembershipContentProps = {
  shouldShowCta: boolean;
};

export default function MembershipContent({ shouldShowCta }: MembershipContentProps) {
  if (shouldShowCta) {
    return <MembershipCtaHero />;
  }

  return <div>Membership content here....</div>;
}
